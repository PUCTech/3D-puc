'use client';
import { Component, type ReactNode } from 'react';

// Catches a scene that fails after the WebGL check (renderer creation, chunk load) so the rest of the page survives.
export class SceneErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
