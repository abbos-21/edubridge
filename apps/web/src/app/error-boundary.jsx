import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';

export class ErrorBoundary extends React.Component {
  constructor() {
    (super(...arguments),
      (this.state = {
        error: null,
      }),
      (this.home = () => {
        try {
          history.replaceState(null, '', '#home');
        } catch {}
        this.setState({
          error: null,
        });
        try {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        } catch {}
      }),
      (this.reset = () => {
        try {
          (localStorage.removeItem('edubridge:v1'), localStorage.removeItem('edubridge:unicompare'));
        } catch {}
        try {
          ((location.hash = 'home'), location.reload());
        } catch {
          this.home();
        }
      }));
  }
  static getDerivedStateFromError(a) {
    return {
      error: a,
    };
  }
  componentDidCatch(a) {
    try {
      console.error('[EduBridge] page error:', a);
    } catch {}
  }
  render() {
    return this.state.error ? (
      <div
        style={{
          maxWidth: 520,
          margin: '15vh auto',
          padding: 16,
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Nimadir xato ketdi · Something went wrong
        </h1>
        <p
          style={{
            marginTop: 8,
            color: '#4f5d76',
          }}
        >
          Sahifani ochib bo‘lmadi. Bosh sahifaga qayting yoki saqlangan ma’lumotlarni tozalang.
        </p>
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={this.home}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#112a57',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Bosh sahifa · Home
          </button>
          <button
            type="button"
            onClick={this.reset}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #dde3ee',
              fontWeight: 700,
            }}
          >
            Tozalash va qayta yuklash · Reset
          </button>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}
