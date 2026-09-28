'use client';

import { useState } from 'react';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import { type CommentItem } from '@/lib/collaboration/types';

export default function CommentsDrawer({ onClose }: { onClose?: () => void }) {
  const {
    architecture,
    selectedNodeId,
    comments,
    addComment,
    addCommentReply,
    toggleCommentResolved,
  } = useArchitectureStore();

  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');

  const selectedNode = architecture.nodes.find(n => n.id === selectedNodeId);

  const filteredComments = comments.filter(c => {
    if (activeTab === 'selected' && selectedNodeId) {
      return c.targetId === selectedNodeId;
    }
    return true;
  });

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const targetType = selectedNode ? 'node' : 'canvas';
    const targetId = selectedNode ? selectedNode.id : (architecture.id || 'arch');
    const targetLabel = selectedNode ? selectedNode.label : (architecture.name || 'Architecture');

    addComment(targetType, targetId, targetLabel, newCommentText.trim(), 'You');
    setNewCommentText('');
  };

  const handleSendReply = (commentId: string) => {
    const text = replyTextMap[commentId];
    if (!text || !text.trim()) return;

    addCommentReply(commentId, text.trim(), 'You');
    setReplyTextMap(prev => ({ ...prev, [commentId]: '' }));
  };

  return (
    <div className="comments-drawer">
      {/* Header */}
      <div className="comments-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-accent)' }}>💬</span>
            <span className="text-label" style={{ color: 'var(--color-accent)' }}>ARCHITECTURAL REVIEW &amp; COMMENTS</span>
          </div>
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            {comments.length} total team threads &bull; {comments.filter(c => !c.resolved).length} open
          </span>
        </div>
        {onClose && (
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="comments-tabs">
        <button
          className={`comment-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Threads ({comments.length})
        </button>
        {selectedNode && (
          <button
            className={`comment-tab ${activeTab === 'selected' ? 'active' : ''}`}
            onClick={() => setActiveTab('selected')}
          >
            On {selectedNode.label} ({comments.filter(c => c.targetId === selectedNode.id).length})
          </button>
        )}
      </div>

      {/* New Comment Composer */}
      <form onSubmit={handleCreateComment} className="comment-composer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
            Target: {selectedNode ? `Node: ${selectedNode.label}` : 'Global Architecture'}
          </span>
        </div>
        <textarea
          placeholder={selectedNode ? `Comment on ${selectedNode.label}...` : 'Add an architectural annotation or question...'}
          className="composer-textarea"
          value={newCommentText}
          onChange={e => setNewCommentText(e.target.value)}
          rows={2}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
            Post Annotation
          </button>
        </div>
      </form>

      {/* Threads List */}
      <div className="comments-list">
        {filteredComments.map(c => (
          <div key={c.id} className={`comment-card ${c.resolved ? 'resolved' : ''}`}>
            <div className="comment-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="user-avatar">{c.avatar}</span>
                <div>
                  <span className="user-name">{c.author}</span>
                  <span className="target-badge text-mono">on {c.targetLabel}</span>
                </div>
              </div>

              <button
                className={`resolve-btn ${c.resolved ? 'is-resolved' : ''}`}
                onClick={() => toggleCommentResolved(c.id)}
                title={c.resolved ? 'Reopen thread' : 'Resolve thread'}
              >
                {c.resolved ? '✓ Resolved' : 'Resolve'}
              </button>
            </div>

            <p className="comment-text">{c.text}</p>

            {/* Replies */}
            {c.replies.length > 0 && (
              <div className="replies-list">
                {c.replies.map(r => (
                  <div key={r.id} className="reply-item">
                    <span className="user-avatar user-avatar--sm">{r.avatar}</span>
                    <div style={{ flex: 1 }}>
                      <span className="user-name" style={{ fontSize: '0.75rem' }}>{r.author}</span>
                      <p className="reply-text">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input */}
            <div className="reply-input-row">
              <input
                type="text"
                placeholder="Reply to thread..."
                className="reply-field"
                value={replyTextMap[c.id] || ''}
                onChange={e => setReplyTextMap({ ...replyTextMap, [c.id]: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendReply(c.id);
                  }
                }}
              />
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.6875rem', padding: '4px 8px' }}
                onClick={() => handleSendReply(c.id)}
              >
                Reply
              </button>
            </div>
          </div>
        ))}

        {filteredComments.length === 0 && (
          <div className="no-comments-msg">
            <p className="text-caption">No annotations recorded for this view.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .comments-drawer {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg-elevated);
          padding: var(--space-4);
          gap: var(--space-3);
        }
        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-border);
        }
        .comments-tabs {
          display: flex;
          gap: var(--space-2);
          border-bottom: 1px solid var(--color-border-subtle);
          padding-bottom: var(--space-2);
        }
        .comment-tab {
          padding: 4px 10px;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: var(--radius-sm);
        }
        .comment-tab.active {
          background: var(--color-bg-surface);
          color: var(--color-text);
          font-weight: 600;
        }
        .comment-composer {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3);
        }
        .composer-textarea {
          width: 100%;
          padding: 6px 8px;
          background: var(--color-bg);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          color: var(--color-text);
          font-size: 0.8125rem;
          font-family: inherit;
          resize: vertical;
        }
        .comments-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .comment-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .comment-card.resolved {
          opacity: 0.65;
          border-color: var(--color-border-subtle);
        }
        .comment-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .user-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-accent);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 700;
        }
        .user-avatar--sm {
          width: 18px;
          height: 18px;
          font-size: 0.5625rem;
        }
        .user-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text);
          margin-right: 6px;
        }
        .target-badge {
          font-size: 0.625rem;
          color: var(--color-text-muted);
        }
        .resolve-btn {
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          padding: 2px 8px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        .resolve-btn.is-resolved {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: var(--color-success);
        }
        .comment-text {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
          margin: 0;
        }
        .replies-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-left: var(--space-3);
          border-left: 2px solid var(--color-border-subtle);
          margin-top: 4px;
        }
        .reply-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }
        .reply-text {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin: 0;
        }
        .reply-input-row {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }
        .reply-field {
          flex: 1;
          padding: 4px 6px;
          background: var(--color-bg);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          color: var(--color-text);
          font-size: 0.75rem;
        }
        .no-comments-msg {
          text-align: center;
          padding: var(--space-8);
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
