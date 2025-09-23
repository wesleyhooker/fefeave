import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="homepage">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">Welcome to Fefe Ave</h1>
          <p class="hero-subtitle">Curated finds, amazing prices. Your treasure hunt starts here.</p>
          <div class="hero-buttons">
            <button class="btn btn-primary">Shop Now</button>
            <button class="btn btn-secondary">Browse Categories</button>
          </div>
        </div>
        <div class="hero-image">
          <div class="featured-finds">
            <div class="featured-header">
              Curator's <span class="gold-text">Choice</span>
            </div>
            <div class="featured-subtitle">Her Best Items</div>
            <div class="featured-grid">
              <div class="featured-item">👗</div>
              <div class="featured-item">👜</div>
              <div class="featured-item">💍</div>
            </div>
            <a href="#" class="featured-cta">Shop All Featured →</a>
          </div>
        </div>
      </section>

      <!-- Featured Categories -->
      <section class="categories">
        <h2>Shop by Category</h2>
        <div class="category-grid">
          @for (category of categories(); track category.id) {
            <div class="category-card">
              <div class="category-icon">{{ category.icon }}</div>
              <h3>{{ category.name }}</h3>
              <p>{{ category.description }}</p>
            </div>
          }
        </div>
      </section>

      <!-- About Section -->
      <section class="about">
        <div class="about-content">
          <h2>About Fefe Ave</h2>
          <p>
            We're passionate about finding unique, high-quality items and bringing them to you at amazing prices. 
            Every item is carefully curated to ensure you get the best value for your money.
          </p>
          <div class="about-features">
            <div class="feature">
              <span class="feature-icon">✨</span>
              <h4>Curated Selection</h4>
              <p>Hand-picked items for quality and style</p>
            </div>
            <div class="feature">
              <span class="feature-icon">💰</span>
              <h4>Great Prices</h4>
              <p>Amazing deals on every item</p>
            </div>
            <div class="feature">
              <span class="feature-icon">🚚</span>
              <h4>Fast Shipping</h4>
              <p>Quick and reliable delivery</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="contact">
        <h2>Get in Touch</h2>
        <p>Have questions or want to see what's new? Follow us on social media!</p>
        <div class="social-links">
          <a href="#" class="social-link">📱 Instagram</a>
          <a href="#" class="social-link">📘 Facebook</a>
          <a href="#" class="social-link">🐦 Twitter</a>
        </div>
      </section>
    </div>
  `,
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  protected readonly categories = signal([
    {
      id: 1,
      name: 'Clothing',
      icon: '👗',
      description: 'Trendy and affordable fashion'
    },
    {
      id: 2,
      name: 'Accessories',
      icon: '👜',
      description: 'Jewelry, bags, and more'
    },
    {
      id: 3,
      name: 'Home Decor',
      icon: '🏠',
      description: 'Beautiful items for your space'
    },
    {
      id: 4,
      name: 'Electronics',
      icon: '📱',
      description: 'Tech deals and gadgets'
    }
  ]);
}
