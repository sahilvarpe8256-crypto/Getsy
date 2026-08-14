import React from 'react';
import { Search, Eye, MapPin } from 'lucide-react';
import './SupportingSection.css';

export function SupportingSection() {
  return (
    <section className="supporting-section">
      <div className="container">
        <div className="supporting-banner">
          <h2 className="supporting-hero">
            Search nearby. See what's available. Walk in with confidence.
          </h2>
          <p className="supporting-lead">
            Getsy connects rural and town shoppers directly with real local merchants, making physical shelf inventory visible online.
          </p>

          <div className="supporting-grid">
            <div className="supporting-card">
              <div className="supporting-icon-wrapper text-blue">
                <Search size={28} />
              </div>
              <h3>1. Search Live Inventory</h3>
              <p>Type any category or product to see verified physical shops carrying it in your area.</p>
            </div>

            <div className="supporting-card">
              <div className="supporting-icon-wrapper text-teal">
                <Eye size={28} />
              </div>
              <h3>2. Check Shelf Availability</h3>
              <p>Know exact prices, size variants, and real stock counts before you step out.</p>
            </div>

            <div className="supporting-card">
              <div className="supporting-icon-wrapper text-amber">
                <MapPin size={28} />
              </div>
              <h3>3. Visit Local Shop</h3>
              <p>Follow landmarks and turn-by-turn directions to make your purchase in person.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
