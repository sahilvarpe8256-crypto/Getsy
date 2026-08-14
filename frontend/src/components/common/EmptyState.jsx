import React from 'react';
import { Package, Search, Heart, MessageSquare, Store, AlertCircle } from 'lucide-react';
import './EmptyState.css';

const iconMap = {
  search: Search,
  wishlist: Heart,
  community: MessageSquare,
  shop: Store,
  package: Package,
  error: AlertCircle,
};

export function EmptyState({
  icon = 'package',
  title = 'No Items Found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
}) {
  const IconComponent = iconMap[icon] || Package;

  return (
    <div className="empty-state-wrapper">
      <div className="empty-state-icon-circle">
        <IconComponent size={42} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button className="empty-state-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
