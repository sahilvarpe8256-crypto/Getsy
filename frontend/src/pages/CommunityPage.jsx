import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MessageSquare, Plus, Search, Tag, Send, CheckCircle, Clock, 
  Trash2, X, Store, AlertCircle, ShoppingBag, ArrowRight, User, Image as ImageIcon
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { LocationModal } from '../components/common/LocationModal';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { fetchApi } from '../services/api';
import './CommunityPage.css';

export function CommunityPage() {
  const { user, isAuthenticated, isCustomer, isOwner } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Post Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    category: 'footwear',
    description: '',
    imageFile: null,
  });
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState(null);

  // Reply State (per post)
  const [replyMessages, setReplyMessages] = useState({});
  const [replySubmitting, setReplySubmitting] = useState({});

  useEffect(() => {
    loadCommunityPosts();
  }, [selectedCategory]);

  const loadCommunityPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryCategory = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const data = await fetchApi(`/community${queryCategory}`);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load community posts:', err);
      setError('Could not load community requests feed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPostModal = () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { message: 'Please log in as a customer to post product requests' } });
      return;
    }
    if (!isCustomer) {
      alert('Only customer accounts can post product requests. Shop owners can reply to requests below!');
      return;
    }
    setPostForm({ category: 'footwear', description: '', imageFile: null });
    setPostError(null);
    setShowPostModal(true);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostSubmitting(true);
    setPostError(null);

    if (!postForm.description.trim()) {
      setPostError('Please describe the product or item you are looking for.');
      setPostSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('category', postForm.category);
      formData.append('description', postForm.description);
      if (postForm.imageFile) {
        formData.append('image', postForm.imageFile);
      }

      await fetchApi('/community', {
        method: 'POST',
        body: formData,
      });

      setShowPostModal(false);
      showToast('Product request posted to community feed! 💬', 'success');
      loadCommunityPosts();
    } catch (err) {
      setPostError(err.message || 'Failed to post request.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleSendReply = async (postId) => {
    const msg = replyMessages[postId];
    if (!msg || !msg.trim()) return;

    setReplySubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      const updatedPost = await fetchApi(`/community/${postId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: msg.trim() }),
      });

      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
      setReplyMessages((prev) => ({ ...prev, [postId]: '' }));
      showToast('Reply sent to customer! 🏪', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send reply.', 'error');
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleStatus = async (postId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const updatedPost = await fetchApi(`/community/${postId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
      showToast(newStatus === 'closed' ? 'Request marked as resolved' : 'Request reopened', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to update request status.', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this product request?')) return;
    try {
      await fetchApi(`/community/${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast('Request deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete request.', 'error');
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.description?.toLowerCase().includes(q) ||
      post.category?.toLowerCase().includes(q) ||
      post.customerId?.name?.toLowerCase().includes(q)
    );
  });

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `/uploads/${url.replace(/^\/uploads\//, '')}`;
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="community-page-wrapper">
      <Header />

      <main className="community-page-main">
        {/* Hero Section */}
        <section className="community-hero-banner">
          <div className="container hero-content-inner">
            <div className="hero-text-box">
              <span className="community-badge-tag">
                <MessageSquare size={14} /> Hyperlocal Community Requests
              </span>
              <h1>Can’t find a product on local shelves? Ask directly!</h1>
              <p>
                Post a product request for {location?.name || 'your city'}. Local merchants monitoring Getsy can reply instantly with shelf availability, price, and stock details.
              </p>
            </div>

            <div className="hero-action-box">
              <button className="btn-post-request" onClick={handleOpenPostModal}>
                <Plus size={18} /> Post a Product Request
              </button>
            </div>
          </div>
        </section>

        <div className="container community-feed-container">
          {/* Feed Filter Controls */}
          <div className="feed-controls-bar">
            <div className="search-filter-input">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search community requests by keyword, product name, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="category-chip-filters">
              {['all', 'footwear', 'clothing', 'ornaments', 'accessories', 'hardware'].map((cat) => (
                <button
                  key={cat}
                  className={selectedCategory === cat ? 'active' : ''}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Posts */}
          {loading ? (
            <SkeletonCard variant="shop-card" count={4} />
          ) : error ? (
            <div className="community-error-card">
              <AlertCircle size={32} />
              <p>{error}</p>
              <button onClick={loadCommunityPosts} className="btn-retry">
                Retry Loading
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              icon="community"
              title="Community is Getting Started"
              description={
                searchQuery
                  ? 'No requests match your search filter. Try another keyword!'
                  : 'Be the first shopper to post a product request! Local shop owners will respond when they have stock available on their shelves.'
              }
              actionLabel="Post Product Request"
              onAction={handleOpenPostModal}
            />
          ) : (
            <div className="community-feed-list">
              {filteredPosts.map((post) => {
                const customerName = post.customerId?.name || 'Local Shopper';
                const isMyPost = isAuthenticated && isCustomer && (post.customerId?._id === user?.id || post.customerId === user?.id);
                const postImg = getImageUrl(post.imageUrl);

                return (
                  <div key={post._id} className={`community-post-card ${post.status === 'closed' ? 'closed-post' : ''}`}>
                    {/* Post Header */}
                    <div className="post-header-bar">
                      <div className="post-user-info">
                        <div className="user-avatar-circle">
                          <User size={18} />
                        </div>
                        <div>
                          <strong className="post-author-name">{customerName}</strong>
                          <span className="post-time-tag">• {formatTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>

                      <div className="post-meta-badges">
                        <span className="post-category-tag">{post.category}</span>
                        {post.status === 'closed' ? (
                          <span className="post-status-badge closed"><CheckCircle size={14} /> Resolved</span>
                        ) : (
                          <span className="post-status-badge open"><Clock size={14} /> Open Request</span>
                        )}
                      </div>
                    </div>

                    {/* Post Body */}
                    <div className="post-body">
                      <p className="post-description-text">{post.description}</p>

                      {postImg && (
                        <div className="post-image-preview">
                          <img src={postImg} alt="Requested product reference" />
                        </div>
                      )}
                    </div>

                    {/* Post Actions for Post Owner */}
                    {isMyPost && (
                      <div className="post-owner-actions">
                        <button
                          className="btn-toggle-status"
                          onClick={() => handleToggleStatus(post._id, post.status)}
                        >
                          {post.status === 'open' ? 'Mark as Resolved / Found' : 'Reopen Request'}
                        </button>
                        <button
                          className="btn-delete-post"
                          onClick={() => handleDeletePost(post._id)}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}

                    {/* Replies Section */}
                    <div className="post-replies-section">
                      <h4 className="replies-title">
                        <Store size={16} /> Local Merchant Responses ({post.replies?.length || 0})
                      </h4>

                      {post.replies && post.replies.length > 0 ? (
                        <div className="replies-list">
                          {post.replies.map((reply, idx) => (
                            <div key={reply._id || idx} className="reply-card">
                              <div className="reply-header">
                                <Link to={`/shops/${reply.shopId}`} className="reply-shop-name">
                                  <Store size={14} /> {reply.shopName}
                                  <CheckCircle size={12} className="text-teal" />
                                </Link>
                                <span className="reply-time">{formatTimeAgo(reply.createdAt)}</span>
                              </div>
                              <p className="reply-message">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-replies-text">No merchant responses yet. Local shop owners will reply here when available.</p>
                      )}

                      {/* Owner Reply Box */}
                      {isAuthenticated && isOwner && post.status === 'open' && (
                        <div className="owner-reply-form">
                          <input
                            type="text"
                            placeholder="Reply as a shop owner (e.g., 'We have this in stock! Visit Apex Footwear for ₹1,800')"
                            value={replyMessages[post._id] || ''}
                            onChange={(e) =>
                              setReplyMessages((prev) => ({ ...prev, [post._id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendReply(post._id);
                            }}
                          />
                          <button
                            className="btn-send-reply"
                            onClick={() => handleSendReply(post._id)}
                            disabled={replySubmitting[post._id] || !replyMessages[post._id]?.trim()}
                          >
                            <Send size={16} /> Reply
                          </button>
                        </div>
                      )}

                      {!isAuthenticated && (
                        <div className="guest-reply-prompt">
                          <span>Are you a shop owner? </span>
                          <Link to="/auth">Log in to your merchant account</Link> to reply with shelf stock!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* --- CREATE POST MODAL --- */}
      {showPostModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ask Local Shops</h3>
              <button className="btn-close-modal" onClick={() => setShowPostModal(false)}>
                <X size={20} />
              </button>
            </div>

            {postError && <div className="modal-error-banner">{postError}</div>}

            <form onSubmit={handleCreatePost} className="modal-form">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={postForm.category}
                  onChange={(e) => setPostForm((p) => ({ ...p, category: e.target.value }))}
                  className="select-input"
                >
                  <option value="footwear">Footwear</option>
                  <option value="clothing">Clothing</option>
                  <option value="ornaments">Jewellery & Ornaments</option>
                  <option value="accessories">Accessories & Bags</option>
                  <option value="hardware">Hardware & Tools</option>
                </select>
              </div>

              <div className="form-group">
                <label>What product are you looking for? *</label>
                <textarea
                  rows="4"
                  placeholder="Describe item name, specific size, color, brand, or style (e.g. 'Looking for Size 9 formal black leather Oxford shoes in Sangamner under ₹2,500')"
                  value={postForm.description}
                  onChange={(e) => setPostForm((p) => ({ ...p, description: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Attach Reference Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPostForm((p) => ({ ...p, imageFile: e.target.files[0] }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={postSubmitting}>
                  {postSubmitting ? 'Posting...' : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <LocationModal />
    </div>
  );
}

export default CommunityPage;
