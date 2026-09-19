import { useState, useEffect, useRef } from 'react';
import {
  WalletCards, BarChart3, Target, Shield, Zap,
  ArrowRight, ChevronDown, Check, TrendingUp,
  PieChart, Bell, Smartphone,
} from 'lucide-react';

type LandingProps = {
  onGetStarted: () => void;
  onLogin: () => void;
};

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ to, prefix = '', suffix = '', duration = 1800 }: {
  to: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          function tick(now: number) {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(ease * to));
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── Fade-in on scroll ────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Mini donut preview ───────────────────────────────────────────────────────
function MiniDonut() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  const segments = [
    { pct: 31, color: '#7355ef' },
    { pct: 19, color: '#3277ed' },
    { pct: 16, color: '#25bd8d' },
    { pct: 12, color: '#f5a719' },
    { pct: 10, color: '#fa773a' },
    { pct: 12, color: '#eb5892' },
  ];

  // Build conic-gradient
  let acc = 0;
  const stops = segments.map(s => {
    const from = acc;
    acc += s.pct;
    return `${s.color} ${from}% ${acc}%`;
  }).join(', ');

  return (
    <div
      className="landing-donut"
      style={{
        background: animated ? `conic-gradient(${stops})` : `conic-gradient(#2a3555 0% 100%)`,
        transition: 'background 1.2s ease',
      }}
    >
      <div className="landing-donut-hole">
        <strong>₦80,500</strong>
        <span>Total</span>
      </div>
    </div>
  );
}

// ─── Mini bar chart preview ───────────────────────────────────────────────────
function MiniBars() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 600);
    return () => clearTimeout(t);
  }, []);

  const bars = [
    [45, 30], [60, 50], [35, 55], [70, 40], [50, 65], [80, 35], [55, 45],
  ];

  return (
    <div className="landing-bars">
      {bars.map(([inc, exp], i) => (
        <div className="landing-bar-group" key={i}>
          <div
            className="landing-bar inc"
            style={{
              height: animated ? `${inc}%` : '0%',
              transitionDelay: `${i * 80}ms`,
            }}
          />
          <div
            className="landing-bar exp"
            style={{
              height: animated ? `${exp}%` : '0%',
              transitionDelay: `${i * 80 + 40}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Landing page ─────────────────────────────────────────────────────────────
export default function LandingPage({ onGetStarted, onLogin }: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const features = [
    {
      icon: <PieChart size={22} />,
      color: '#7355ef',
      title: 'Spending Insights',
      body: 'Visual breakdowns of where your money goes every month, automatically categorised.',
    },
    {
      icon: <BarChart3 size={22} />,
      color: '#3277ed',
      title: 'Cash Flow Charts',
      body: 'See your income vs expenses at a glance with animated, interactive bar charts.',
    },
    {
      icon: <Target size={22} />,
      color: '#25bd8d',
      title: 'Savings Goals',
      body: 'Set targets for what matters — vacations, gadgets, emergency funds — and watch progress grow.',
    },
    {
      icon: <WalletCards size={22} />,
      color: '#f5a719',
      title: 'Budget Tracking',
      body: 'Set limits per category and get alerted before you overspend.',
    },
    {
      icon: <Bell size={22} />,
      color: '#fa773a',
      title: 'Smart Notifications',
      body: 'Stay informed with timely alerts about your spending, reports, and budget health.',
    },
    {
      icon: <Smartphone size={22} />,
      color: '#eb5892',
      title: 'Works Everywhere',
      body: 'Fully responsive on mobile, tablet, and desktop — your finances, wherever you are.',
    },
  ];

  const steps = [
    { n: '01', title: 'Create your account', body: 'Sign up in seconds with just your name, email, and password.' },
    { n: '02', title: 'Log your transactions', body: 'Add income and expenses with category, date, and amount.' },
    { n: '03', title: 'Watch the insights appear', body: 'Charts, breakdowns, and summaries update automatically in real time.' },
  ];

  const stats = [
    { to: 1200, suffix: '+', label: 'Transactions tracked' },
    { to: 98,   suffix: '%', label: 'User satisfaction' },
    { to: 50,   prefix: '₦', suffix: 'M+', label: 'Money managed' },
  ];

  return (
    <div className="landing">

      {/* ── Navbar ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="brand-mark"><WalletCards size={18} /></div>
            <span>Expense<span>Flow</span></span>
          </div>
          <div className={`landing-nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#features"   onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how"        onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#stats"      onClick={() => setMenuOpen(false)}>About</a>
            <button className="landing-nav-login"  onClick={onLogin}>Log In</button>
            <button className="landing-nav-signup" onClick={onGetStarted}>Sign Up Free</button>
          </div>
          <button className="landing-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-bg-orbs">
          <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
        </div>
        <div className="landing-container hero-inner">
          <div className="hero-text">
            <div className="hero-badge"><Zap size={13} /> Smart finance tracking</div>
            <h1 className="hero-title">
              Take control of<br />
              <span className="hero-gradient">every naira</span><br />
              you earn & spend.
            </h1>
            <p className="hero-body">
              ExpenseFlow gives you a clear, real-time picture of your finances.
              Track transactions, set budgets, hit goals — all in one beautiful dashboard.
            </p>
            <div className="hero-actions">
              <button className="hero-cta" onClick={onGetStarted}>
                Get Started Free <ArrowRight size={16} />
              </button>
              <button className="hero-secondary" onClick={onLogin}>
                I already have an account
              </button>
            </div>
            <div className="hero-trust">
              {['No credit card required', 'Free forever plan', 'Secure & private'].map(t => (
                <span key={t}><Check size={12} />{t}</span>
              ))}
            </div>
          </div>

          {/* Hero preview card */}
          <div className="hero-preview">
            <div className="preview-card">
              <div className="preview-topbar">
                <span className="preview-dot r" /><span className="preview-dot y" /><span className="preview-dot g" />
                <span className="preview-title">ExpenseFlow Dashboard</span>
              </div>
              <div className="preview-stats">
                {[
                  { label: 'Total Income', val: '₦250,000', color: '#25bd8d' },
                  { label: 'Expenses',     val: '₦80,500',  color: '#f04b67' },
                  { label: 'Balance',      val: '₦169,500', color: '#3277ed' },
                ].map(s => (
                  <div className="preview-stat" key={s.label}>
                    <div className="preview-stat-dot" style={{ background: s.color }} />
                    <div>
                      <small>{s.label}</small>
                      <strong>{s.val}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="preview-charts">
                <MiniDonut />
                <MiniBars />
              </div>
            </div>
          </div>
        </div>
        <a href="#features" className="hero-scroll-hint">
          <span>Scroll to explore</span>
          <ChevronDown size={18} />
        </a>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats" id="stats">
        <div className="landing-container stats-inner">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 120} className="stat-item">
              <strong>
                <AnimatedNumber to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </strong>
              <span>{s.label}</span>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features" id="features">
        <div className="landing-container">
          <FadeIn className="section-header">
            <p className="section-eyebrow">Everything you need</p>
            <h2 className="section-title">Built for real financial clarity</h2>
            <p className="section-sub">No fluff. Just the tools that actually help you understand and improve your money habits.</p>
          </FadeIn>
          <div className="features-grid">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 80} className="feature-card">
                <div className="feature-icon" style={{ background: f.color + '18', color: f.color }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-how" id="how">
        <div className="landing-container">
          <FadeIn className="section-header">
            <p className="section-eyebrow">Simple by design</p>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-sub">Three steps and you're tracking your finances like a pro.</p>
          </FadeIn>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 150} className="step-card">
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                {i < steps.length - 1 && <div className="step-arrow"><ArrowRight size={18} /></div>}
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing-cta-banner">
        <div className="cta-banner-orbs">
          <div className="orb orb1" /><div className="orb orb2" />
        </div>
        <div className="landing-container cta-banner-inner">
          <FadeIn className="cta-banner-text">
            <h2>Ready to master your finances?</h2>
            <p>Join ExpenseFlow today. It's free to get started — no card needed.</p>
          </FadeIn>
          <FadeIn delay={150} className="cta-banner-actions">
            <button className="hero-cta" onClick={onGetStarted}>
              Create Free Account <ArrowRight size={16} />
            </button>
            <button className="hero-secondary light" onClick={onLogin}>
              Log In
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="landing-brand">
            <div className="brand-mark"><WalletCards size={16} /></div>
            <span>Expense<span>Flow</span></span>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} ExpenseFlow. Built with care.</p>
          <div className="footer-links">
            <button onClick={onLogin}>Log In</button>
            <button onClick={onGetStarted}>Sign Up</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
