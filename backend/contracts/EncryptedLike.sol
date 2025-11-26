// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedLike - A decentralized social like system with fully encrypted interactions
/// @notice This contract allows users to create posts with reactions, comments, and categories
/// @dev All interaction counts are encrypted using FHEVM, only post authors can decrypt
contract EncryptedLike is ZamaEthereumConfig {
    /// @notice Reaction types enum
    enum ReactionType {
        Like,      // 0: 👍 like
        Love,      // 1: ❤️ love
        Clap,      // 2: 👏 clap
        Celebrate, // 3: 🎉 celebrate
        Idea       // 4: 💡 thoughts
    }

    /// @notice Post structure
    struct Post {
        address author;
        string content;
        string category;
        string[] tags;
        euint32 encryptedLikeCount;
        euint32 encryptedLoveCount;
        euint32 encryptedClapCount;
        euint32 encryptedCelebrateCount;
        euint32 encryptedIdeaCount;
        euint32 encryptedCommentCount;
        uint256 timestamp;
    }

    /// @notice Comment structure
    struct Comment {
        address author;
        euint32[] encryptedContent;
        uint256 postId;
        uint256 parentCommentId;   // 0 means top-level comment, >0 means reply
        uint256 timestamp;
        euint32 encryptedLikeCount;
    }

    /// @notice Mapping from post ID to Post
    mapping(uint256 => Post) public posts;
    
    /// @notice Mapping from comment ID to Comment
    mapping(uint256 => Comment) public comments;
    
    /// @notice Total number of posts
    uint256 public postCount;
    
    /// @notice Total number of comments
    uint256 public commentCount;
    
    /// @notice Mapping from post ID to author address (for ACL permissions)
    mapping(uint256 => address) public postAuthors;

    /// @notice Mapping from user address => post ID => reaction type
    /// @dev Tracks user's current reaction to each post. Default value is Like (0), so we use a separate mapping to track if user has reacted
    mapping(address => mapping(uint256 => ReactionType)) public userReactions;
    mapping(address => mapping(uint256 => bool)) public hasUserReacted;

    /// @notice Mapping from category hash (keccak256(bytes(category))) to encrypted total reaction counts
    mapping(bytes32 => euint32) public categoryReactionCounts;
    /// @notice Track whether categoryReactionCounts has been initialized to avoid comparing euint32 to zero
    mapping(bytes32 => bool) private categoryInitialized;

    /// @notice Event emitted when a new post is created
    event PostCreated(uint256 indexed postId, address indexed author, string content, string category);
    
    /// @notice Event emitted when a reaction is added/changed to a post
    event ReactionChanged(uint256 indexed postId, address indexed user, ReactionType reactionType);
    
    /// @notice Event emitted when a reaction is removed from a post
    event ReactionRemoved(uint256 indexed postId, address indexed user);
    
    /// @notice Event emitted when a comment is added
    event CommentAdded(uint256 indexed commentId, uint256 indexed postId, address indexed author, uint256 parentCommentId);
    
    /// @notice Event emitted when a comment is liked
    event CommentLiked(uint256 indexed commentId, address indexed liker);

    /// @notice Create a new post
    /// @param content The content of the post
    /// @param category The category of the post
    /// @param tags Array of tags for the post
    /// @return postId The ID of the newly created post
    function createPost(
        string memory content,
        string memory category,
        string[] memory tags
    ) external returns (uint256) {
        uint256 postId = postCount;
        postCount++;
        
        // Initialize all encrypted counts to zero
        euint32 zero = FHE.asEuint32(0);
        
        posts[postId] = Post({
            author: msg.sender,
            content: content,
            category: category,
            tags: tags,
            encryptedLikeCount: zero,
            encryptedLoveCount: zero,
            encryptedClapCount: zero,
            encryptedCelebrateCount: zero,
            encryptedIdeaCount: zero,
            encryptedCommentCount: zero,
            timestamp: block.timestamp
        });
        
        postAuthors[postId] = msg.sender;
        
        // Grant the author permission to decrypt all encrypted fields
        _grantDecryptPermissions(postId, msg.sender);
        
        emit PostCreated(postId, msg.sender, content, category);
        
        return postId;
    }

    /// @notice Add or change a reaction to a post
    /// @param postId The ID of the post
    /// @param reactionType The type of reaction (0-4)
    /// @param inputEuint32 The encrypted input value (should be 1)
    /// @param inputProof The input proof
    function addReaction(
        uint256 postId,
        ReactionType reactionType,
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) public {
        require(postId < postCount, "Post does not exist");
        require(uint8(reactionType) < 5, "Invalid reaction type");
        
        // Convert external encrypted input to internal encrypted type
        euint32 encryptedReaction = FHE.fromExternal(inputEuint32, inputProof);
        
        // If user already has a reaction, remove it first
        if (hasUserReacted[msg.sender][postId]) {
            ReactionType currentReaction = userReactions[msg.sender][postId];
            _removeReactionFromPost(postId, currentReaction, encryptedReaction);
            
            // Update category reaction count (remove old)
            string memory category = posts[postId].category;
            if (bytes(category).length > 0) {
                bytes32 catKey = keccak256(bytes(category));
                euint32 currentCategoryCount = categoryReactionCounts[catKey];
                categoryReactionCounts[catKey] = FHE.sub(currentCategoryCount, encryptedReaction);
            }
        }
        
        // Add the new reaction
        _addReactionToPost(postId, reactionType, encryptedReaction);
        
        // Update user's reaction tracking
        userReactions[msg.sender][postId] = reactionType;
        hasUserReacted[msg.sender][postId] = true;
        
        // Update category reaction count (add new)
        {
            string memory category2 = posts[postId].category;
            if (bytes(category2).length > 0) {
                bytes32 catKey2 = keccak256(bytes(category2));
                if (!categoryInitialized[catKey2]) {
                    categoryReactionCounts[catKey2] = encryptedReaction;
                    categoryInitialized[catKey2] = true;
                } else {
                    euint32 currentCategoryCount2 = categoryReactionCounts[catKey2];
                    categoryReactionCounts[catKey2] = FHE.add(currentCategoryCount2, encryptedReaction);
                }
            }
        }
        
        _grantDecryptPermissions(postId, posts[postId].author);
        
        emit ReactionChanged(postId, msg.sender, reactionType);
    }

    /// @notice Remove a reaction from a post
    /// @param postId The ID of the post
    /// @param inputEuint32 The encrypted input value (should be 1)
    /// @param inputProof The input proof
    function removeReaction(
        uint256 postId,
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external {
        require(postId < postCount, "Post does not exist");
        require(hasUserReacted[msg.sender][postId], "No reaction to remove");
        
        ReactionType currentReaction = userReactions[msg.sender][postId];
        
        // Convert external encrypted input to internal encrypted type
        euint32 encryptedReaction = FHE.fromExternal(inputEuint32, inputProof);
        
        // Remove the reaction
        _removeReactionFromPost(postId, currentReaction, encryptedReaction);
        
        // Update category reaction count
        string memory category = posts[postId].category;
        if (bytes(category).length > 0) {
            bytes32 catKey = keccak256(bytes(category));
            euint32 currentCategoryCount = categoryReactionCounts[catKey];
            categoryReactionCounts[catKey] = FHE.sub(currentCategoryCount, encryptedReaction);
        }
        
        // Clear user's reaction
        delete userReactions[msg.sender][postId];
        hasUserReacted[msg.sender][postId] = false;
        
        emit ReactionRemoved(postId, msg.sender);
    }

    /// @notice Add an encrypted comment to a post
    /// @param postId The ID of the post
    /// @param parentCommentId The ID of parent comment (0 for top-level)
    /// @param encryptedContentChunks The encrypted comment content chunks
    /// @param contentProof The proof for encrypted content
    /// @param countInputEuint32 The encrypted input value for incrementing comment count (should be 1)
    /// @param countInputProof The input proof for count
    function addComment(
        uint256 postId,
        uint256 parentCommentId,
        externalEuint32[] calldata encryptedContentChunks,
        bytes calldata contentProof,
        externalEuint32 countInputEuint32,
        bytes calldata countInputProof
    ) external {
        require(postId < postCount, "Post does not exist");
        if (parentCommentId > 0) {
            require(parentCommentId < commentCount, "Parent comment does not exist");
        }
        
        uint256 commentId = commentCount;
        commentCount++;
        
        // Convert encrypted content chunks
        uint256 chunksLen = encryptedContentChunks.length;
        require(chunksLen > 0, "Empty content");
        euint32[] memory contentArray = new euint32[](chunksLen);
        for (uint256 i = 0; i < chunksLen; i++) {
            contentArray[i] = FHE.fromExternal(encryptedContentChunks[i], contentProof);
        }
        
        // Convert encrypted count increment
        euint32 encryptedOne = FHE.fromExternal(countInputEuint32, countInputProof);
        
        comments[commentId] = Comment({
            author: msg.sender,
            encryptedContent: contentArray,
            postId: postId,
            parentCommentId: parentCommentId,
            timestamp: block.timestamp,
            encryptedLikeCount: FHE.asEuint32(0)
        });
        
        // Increment post's comment count
        posts[postId].encryptedCommentCount = FHE.add(
            posts[postId].encryptedCommentCount,
            encryptedOne
        );
        
        // Grant permissions
        for (uint256 j = 0; j < chunksLen; j++) {
            FHE.allowThis(comments[commentId].encryptedContent[j]);
            FHE.allow(comments[commentId].encryptedContent[j], posts[postId].author);
        }
        FHE.allowThis(posts[postId].encryptedCommentCount);
        FHE.allow(posts[postId].encryptedCommentCount, posts[postId].author);
        
        emit CommentAdded(commentId, postId, msg.sender, parentCommentId);
    }

    /// @notice Add a like to a comment
    /// @param commentId The ID of the comment
    /// @param inputEuint32 The encrypted input value (should be 1)
    /// @param inputProof The input proof
    function addCommentLike(
        uint256 commentId,
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external {
        require(commentId < commentCount, "Comment does not exist");
        
        euint32 encryptedLike = FHE.fromExternal(inputEuint32, inputProof);
        
        comments[commentId].encryptedLikeCount = FHE.add(
            comments[commentId].encryptedLikeCount,
            encryptedLike
        );
        
        FHE.allowThis(comments[commentId].encryptedLikeCount);
        FHE.allow(comments[commentId].encryptedLikeCount, comments[commentId].author);
        
        emit CommentLiked(commentId, msg.sender);
    }

    /// @notice Internal helper to add reaction to post
    function _addReactionToPost(uint256 postId, ReactionType reactionType, euint32 encryptedReaction) internal {
        if (reactionType == ReactionType.Like) {
            posts[postId].encryptedLikeCount = FHE.add(posts[postId].encryptedLikeCount, encryptedReaction);
        } else if (reactionType == ReactionType.Love) {
            posts[postId].encryptedLoveCount = FHE.add(posts[postId].encryptedLoveCount, encryptedReaction);
        } else if (reactionType == ReactionType.Clap) {
            posts[postId].encryptedClapCount = FHE.add(posts[postId].encryptedClapCount, encryptedReaction);
        } else if (reactionType == ReactionType.Celebrate) {
            posts[postId].encryptedCelebrateCount = FHE.add(posts[postId].encryptedCelebrateCount, encryptedReaction);
        } else if (reactionType == ReactionType.Idea) {
            posts[postId].encryptedIdeaCount = FHE.add(posts[postId].encryptedIdeaCount, encryptedReaction);
        }
    }

    /// @notice Internal helper to remove reaction from post
    function _removeReactionFromPost(uint256 postId, ReactionType reactionType, euint32 encryptedReaction) internal {
        if (reactionType == ReactionType.Like) {
            posts[postId].encryptedLikeCount = FHE.sub(posts[postId].encryptedLikeCount, encryptedReaction);
        } else if (reactionType == ReactionType.Love) {
            posts[postId].encryptedLoveCount = FHE.sub(posts[postId].encryptedLoveCount, encryptedReaction);
        } else if (reactionType == ReactionType.Clap) {
            posts[postId].encryptedClapCount = FHE.sub(posts[postId].encryptedClapCount, encryptedReaction);
        } else if (reactionType == ReactionType.Celebrate) {
            posts[postId].encryptedCelebrateCount = FHE.sub(posts[postId].encryptedCelebrateCount, encryptedReaction);
        } else if (reactionType == ReactionType.Idea) {
            posts[postId].encryptedIdeaCount = FHE.sub(posts[postId].encryptedIdeaCount, encryptedReaction);
        }
    }


    /// @notice Internal helper to grant decrypt permissions
    function _grantDecryptPermissions(uint256 postId, address author) internal {
        Post storage post = posts[postId];
        FHE.allowThis(post.encryptedLikeCount);
        FHE.allow(post.encryptedLikeCount, author);
        FHE.allowThis(post.encryptedLoveCount);
        FHE.allow(post.encryptedLoveCount, author);
        FHE.allowThis(post.encryptedClapCount);
        FHE.allow(post.encryptedClapCount, author);
        FHE.allowThis(post.encryptedCelebrateCount);
        FHE.allow(post.encryptedCelebrateCount, author);
        FHE.allowThis(post.encryptedIdeaCount);
        FHE.allow(post.encryptedIdeaCount, author);
        FHE.allowThis(post.encryptedCommentCount);
        FHE.allow(post.encryptedCommentCount, author);
    }

    /// @notice Get the encrypted reaction count for a post
    /// @param postId The ID of the post
    /// @param reactionType The type of reaction (0-4)
    /// @return The encrypted reaction count
    function getReactionCount(uint256 postId, ReactionType reactionType) public view returns (euint32) {
        require(postId < postCount, "Post does not exist");
        require(uint8(reactionType) < 5, "Invalid reaction type");
        
        if (reactionType == ReactionType.Like) {
            return posts[postId].encryptedLikeCount;
        } else if (reactionType == ReactionType.Love) {
            return posts[postId].encryptedLoveCount;
        } else if (reactionType == ReactionType.Clap) {
            return posts[postId].encryptedClapCount;
        } else if (reactionType == ReactionType.Celebrate) {
            return posts[postId].encryptedCelebrateCount;
        } else {
            return posts[postId].encryptedIdeaCount;
        }
    }

    /// @notice Get the encrypted comment count for a post
    /// @param postId The ID of the post
    /// @return The encrypted comment count
    function getCommentCount(uint256 postId) external view returns (euint32) {
        require(postId < postCount, "Post does not exist");
        return posts[postId].encryptedCommentCount;
    }

    /// @notice Get post information
    /// @param postId The ID of the post
    /// @return author The address of the post author
    /// @return content The content of the post
    /// @return category The category of the post
    /// @return tags The tags of the post
    /// @return timestamp The timestamp when the post was created
    function getPost(uint256 postId) external view returns (
        address author,
        string memory content,
        string memory category,
        string[] memory tags,
        uint256 timestamp
    ) {
        require(postId < postCount, "Post does not exist");
        Post memory post = posts[postId];
        return (post.author, post.content, post.category, post.tags, post.timestamp);
    }

    /// @notice Get comment information
    /// @param commentId The ID of the comment
    /// @return author The address of the comment author
    /// @return postId The ID of the post
    /// @return parentCommentId The ID of parent comment (0 for top-level)
    /// @return timestamp The timestamp when the comment was created
    function getComment(uint256 commentId) external view returns (
        address author,
        uint256 postId,
        uint256 parentCommentId,
        uint256 timestamp
    ) {
        require(commentId < commentCount, "Comment does not exist");
        Comment memory comment = comments[commentId];
        return (comment.author, comment.postId, comment.parentCommentId, comment.timestamp);
    }

    /// @notice Get number of encrypted content chunks for a comment
    /// @param commentId The ID of the comment
    function getCommentContentChunkCount(uint256 commentId) external view returns (uint256) {
        require(commentId < commentCount, "Comment does not exist");
        return comments[commentId].encryptedContent.length;
    }

    /// @notice Get one encrypted content chunk for a comment
    /// @param commentId The ID of the comment
    /// @param index The chunk index
    /// @return The encrypted content chunk
    function getCommentContentChunk(uint256 commentId, uint256 index) external view returns (euint32) {
        require(commentId < commentCount, "Comment does not exist");
        require(index < comments[commentId].encryptedContent.length, "Chunk index out of bounds");
        return comments[commentId].encryptedContent[index];
    }

    /// @notice Get the total number of posts
    /// @return The total number of posts
    function getPostCount() external view returns (uint256) {
        return postCount;
    }

    /// @notice Get the total number of comments
    /// @return The total number of comments
    function getCommentCount() external view returns (uint256) {
        return commentCount;
    }

    /// @notice Get user's reaction to a post
    /// @param user The user address
    /// @param postId The ID of the post
    /// @return The reaction type (0 = No reaction)
    function getUserReaction(address user, uint256 postId) external view returns (ReactionType) {
        return userReactions[user][postId];
    }

    /// @notice Get encrypted category reaction count
    /// @param category The category name
    /// @return The encrypted total reaction count for the category
    function getCategoryReactionCount(string memory category) external view returns (euint32) {
        bytes32 catKey = keccak256(bytes(category));
        return categoryReactionCounts[catKey];
    }

    // Legacy function for backward compatibility
    /// @notice Add an encrypted like to a post (legacy function)
    /// @param postId The ID of the post to like
    /// @param inputEuint32 The encrypted input value (should be 1)
    /// @param inputProof The input proof
    function addLike(
        uint256 postId,
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external {
        addReaction(postId, ReactionType.Like, inputEuint32, inputProof);
    }

    /// @notice Get the encrypted like count for a post (legacy function)
    /// @param postId The ID of the post
    /// @return The encrypted like count
    function getLikeCount(uint256 postId) external view returns (euint32) {
        return getReactionCount(postId, ReactionType.Like);
    }
}

