"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useEncryptedLike, ReactionType } from "@/hooks/useEncryptedLike";
import { useState } from "react";

export const EncryptedLikeDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const encryptedLike = useEncryptedLike({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    userAddress: accounts?.[0],
  });

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentTexts, setCommentTexts] = useState<{ [postId: number]: string }>({});
  const [activeView, setActiveView] = useState<"create" | "view">("view");

  const categories = ["Technology", "Lifestyle", "Art", "Other"];

  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md " +
    "transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:bg-blue-800 transform hover:-translate-y-0.5 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:transform-none disabled:shadow-md";

  const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-lg bg-slate-800 px-5 py-2.5 font-medium text-white shadow-md " +
    "transition-all duration-200 hover:bg-slate-900 hover:shadow-lg active:bg-black transform hover:-translate-y-0.5 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:transform-none disabled:shadow-md";

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="text-center space-y-6 p-8 animate-fade-in">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-slate-900">EncryptedLike</h1>
            <p className="text-xl text-slate-600 max-w-md mx-auto">
              Privacy-First Social Interaction Platform
            </p>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              Built with Fully Homomorphic Encryption (FHE) to protect your reactions and comments
            </p>
          </div>
          <div className="pt-4">
            <button 
              className={primaryButtonClass}
              onClick={connect}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
              </svg>
              Connect MetaMask Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (encryptedLike.isDeployed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="max-w-lg w-full bg-red-50 border-2 border-red-300 rounded-xl p-8 shadow-lg animate-slide-in">
          <div className="flex items-start space-x-4">
            <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Contract Not Deployed</h3>
              <p className="text-red-800 leading-relaxed">
                The EncryptedLike smart contract is not deployed on Chain ID <span className="font-semibold">{chainId}</span>.
                Please deploy the contract first or switch to a supported network.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">EncryptedLike</h1>
                <p className="text-xs text-slate-500">Privacy-preserving social platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">Connected Account</p>
                <p className="text-sm font-mono text-slate-800">{accounts?.[0]?.slice(0, 6)}...{accounts?.[0]?.slice(-4)}</p>
              </div>
              <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                Chain {chainId}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* View Toggle Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView("view")}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeView === "view"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>View Posts</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView("create")}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeView === "create"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Post</span>
              </div>
            </button>
          </div>
        </div>

        {/* Create Post View */}
        {activeView === "create" && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 animate-slide-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Create New Post</h2>
            </div>
            
            <textarea
              className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-slate-800 placeholder-slate-400 resize-none"
              rows={4}
              placeholder="Share your thoughts with the community..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-slate-800 bg-white"
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tags <span className="text-slate-400 font-normal">(comma separated)</span></label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-slate-800 placeholder-slate-400"
                  placeholder="e.g. blockchain, privacy, tech"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                className={primaryButtonClass}
                disabled={!encryptedLike.isDeployed || encryptedLike.isCreatingPost || !newPostContent.trim()}
                onClick={() => {
                  const tags = newPostTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
                  encryptedLike.createPost(newPostContent, newPostCategory, tags);
                  setNewPostContent("");
                  setNewPostCategory("");
                  setNewPostTags("");
                }}
              >
                {encryptedLike.isCreatingPost ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publishing Post...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Publish Post
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* View Posts Section */}
        {activeView === "view" && (
          <>
            {/* Posts List Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-slate-900">
                Community Posts
                <span className="ml-3 text-lg font-normal text-slate-500">
                  ({encryptedLike.postCount} {encryptedLike.postCount === 1 ? 'post' : 'posts'})
                </span>
              </h2>
              {encryptedLike.isRefreshing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Loading posts...</span>
                </div>
              )}
            </div>

            {/* Empty State */}
            {encryptedLike.posts.length === 0 && !encryptedLike.isRefreshing && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center animate-fade-in">
                <svg className="w-24 h-24 text-slate-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No Posts Yet</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Be the first to share something with the community! Your post will be encrypted and secured with FHE technology.
                </p>
              </div>
            )}

            {/* Posts */}
            <div className="space-y-6">
              {encryptedLike.posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300 animate-slide-in"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {post.author.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-mono text-sm text-slate-700">{post.author.slice(0, 8)}...{post.author.slice(-6)}</p>
                      {post.isAuthor && (
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">You</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(Number(post.timestamp) * 1000).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-5">
                <p className="text-lg text-slate-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.category && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg shadow-sm">
                      {post.category}
                    </span>
                  )}
                  {post.tags && post.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reactions Section */}
              <div className="pt-6 border-t border-slate-200">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">React to this post</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(ReactionType)
                      .filter((v) => typeof v === "number")
                      .map((reactionType) => {
                        const rt = reactionType as ReactionType;
                        const isActive = post.userReaction === rt;
                        return (
                          <button
                            key={rt}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              isActive
                                ? "bg-blue-600 text-white shadow-md transform -translate-y-0.5"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={
                              !encryptedLike.isDeployed ||
                              encryptedLike.isReacting ||
                              !fhevmInstance
                            }
                            onClick={() => {
                              if (isActive) {
                                encryptedLike.removeReaction(post.id);
                              } else {
                                encryptedLike.addReaction(post.id, rt);
                              }
                            }}
                          >
                            <span className="mr-1.5">{encryptedLike.ReactionEmojis[rt]}</span>
                            {encryptedLike.ReactionNames[rt]}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Reaction Counts */}
                <div className="bg-slate-50 rounded-xl p-4 mt-4">
                  <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Reaction Statistics (Encrypted)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.values(ReactionType)
                      .filter((v) => typeof v === "number")
                      .map((reactionType) => {
                        const rt = reactionType as ReactionType;
                        const handle = post.reactionHandles[rt];
                        const decrypted = post.decryptedReactions[rt];
                        return (
                          <div key={rt} className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{encryptedLike.ReactionEmojis[rt]}</span>
                              <span className="font-bold text-lg text-slate-800">
                                {post.isAuthor && decrypted !== undefined
                                  ? decrypted.toString()
                                  : encryptedLike.getReactionStatus(decrypted)}
                              </span>
                            </div>
                            {post.isAuthor && handle && decrypted === undefined && (
                              <button
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
                                onClick={() =>
                                  encryptedLike.decryptReactionCount(post.id, rt, handle)
                                }
                                disabled={encryptedLike.isDecrypting}
                              >
                                {encryptedLike.isDecrypting ? 'Decrypting...' : 'Decrypt Count'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-6 border-t border-slate-200 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">
                      Comments: {" "}
                      <span className="text-blue-600">
                        {post.isAuthor && post.decryptedCommentCount !== undefined
                          ? post.decryptedCommentCount.toString()
                          : encryptedLike.getReactionStatus(post.decryptedCommentCount)}
                      </span>
                    </span>
                    {post.isAuthor && post.commentCountHandle && post.decryptedCommentCount === undefined && (
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        onClick={() =>
                          encryptedLike.decryptCommentCount(post.id, post.commentCountHandle!)
                        }
                        disabled={encryptedLike.isDecrypting}
                      >
                        {encryptedLike.isDecrypting ? 'Decrypting...' : 'Decrypt Count'}
                      </button>
                    )}
                  </div>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                    onClick={() =>
                      setExpandedPostId(
                        expandedPostId === post.id ? null : post.id
                      )
                    }
                  >
                    {expandedPostId === post.id ? (
                      <>
                        <span>Hide Comments</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>View Comments</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {expandedPostId === post.id && (
                  <div className="space-y-4 mt-4 animate-fade-in">
                    {/* Add Comment */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="flex-1 p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-slate-800 placeholder-slate-400"
                        placeholder="Share your thoughts on this post..."
                        value={commentTexts[post.id] || ""}
                        onChange={(e) =>
                          setCommentTexts({
                            ...commentTexts,
                            [post.id]: e.target.value,
                          })
                        }
                      />
                      <button
                        className={secondaryButtonClass}
                        disabled={
                          !encryptedLike.isDeployed ||
                          encryptedLike.isAddingComment ||
                          !fhevmInstance ||
                          !commentTexts[post.id]?.trim()
                        }
                        onClick={() => {
                          encryptedLike.addComment(
                            post.id,
                            commentTexts[post.id] || ""
                          );
                          setCommentTexts({
                            ...commentTexts,
                            [post.id]: "",
                          });
                        }}
                      >
                        {encryptedLike.isAddingComment ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Posting...
                          </>
                        ) : (
                          "Post Comment"
                        )}
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {encryptedLike.comments
                        .filter((c) => c.postId === post.id && c.parentCommentId === 0)
                        .sort((a, b) => {
                          // Sort by timestamp descending (newest first)
                          const timestampA = Number(a.timestamp);
                          const timestampB = Number(b.timestamp);
                          return timestampB - timestampA;
                        })
                        .map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm">
                                  {comment.author.slice(2, 4).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="font-mono text-sm text-slate-700">
                                    {comment.author.slice(0, 8)}...{comment.author.slice(-6)}
                                  </p>
                                  {comment.decryptedContent ? (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                      Decrypted
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded">
                                      Encrypted
                                    </span>
                                  )}
                                </div>
                                {comment.decryptedContent ? (
                                  <p className="text-sm text-slate-800 mt-1">
                                    {comment.decryptedContent}
                                  </p>
                                ) : (
                                  <>
                                    <p className="text-sm text-slate-600 italic">
                                      Comment content is encrypted for privacy
                                    </p>
                                    {comment.canDecrypt && comment.contentHandles && comment.contentHandles.length > 0 && (
                                      <button
                                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                        onClick={() =>
                                          encryptedLike.decryptCommentContent(comment.id, comment.contentHandles!)
                                        }
                                        disabled={encryptedLike.isDecrypting}
                                      >
                                        {encryptedLike.isDecrypting ? 'Decrypting...' : 'Decrypt Comment(Only the author can decrypt)'}
                                      </button>
                                    )}
                                  </>
                                )}
                                <p className="text-xs text-slate-400 mt-2">
                                  {new Date(Number(comment.timestamp) * 1000).toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
              ))}
            </div>
          </>
        )}

        {/* Status Message */}
        {encryptedLike.message && (
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-5 animate-fade-in">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-900 flex-1">{encryptedLike.message}</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 bg-slate-100 border border-slate-300 rounded-xl p-6 text-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-600 mb-1">
                <span className="font-semibold text-slate-900">FHEVM Status:</span>{" "}
                <span className={`font-medium ${fhevmStatus === 'ready' ? 'text-green-600' : 'text-amber-600'}`}>
                  {fhevmStatus}
                </span>
              </p>
              {fhevmError && (
                <p className="text-red-700 text-xs mt-2 bg-red-50 p-2 rounded">
                  <span className="font-semibold">Error:</span> {fhevmError.message}
                </p>
              )}
            </div>
            <div>
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">Contract Address:</span>
              </p>
              <p className="font-mono text-xs text-slate-700 mt-1 break-all">
                {encryptedLike.contractAddress || "Not deployed"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

