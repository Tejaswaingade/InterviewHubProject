import React from 'react'
import { Link } from 'react-router-dom'

export function About() {
  return (
    <div id="about-page" className="container section" style={{ maxWidth: '880px', padding: '2.5rem 1.5rem' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span
          className="badge"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--brand-primary)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          ⚡ OUR MISSION & ETHOS
        </span>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            lineHeight: 1.2,
          }}
          id="about-title"
        >
          Empowering Engineers to Interview with Clarity
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          InterviewHub is a collaborative, candidate-first technical interview intelligence platform designed to replace interview anxiety with focused preparation.
        </p>
      </div>

      {/* Main Philosophy Card */}
      <div
        className="card"
        style={{
          padding: '2.25rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2.5rem',
        }}
        id="about-mission-card"
      >
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.85rem' }}>
          Why We Built InterviewHub
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.98rem' }}>
          Technical hiring in modern software engineering is notoriously opaque. Candidates frequently spend hundreds of hours solving random problems without understanding the actual round structure, interviewer evaluation criteria, or real-world problem sets prioritized by hiring teams.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.98rem', marginBottom: 0 }}>
          InterviewHub bridges this divide by providing a structured, community-powered repository where engineers share verified interview journeys—including online assessments, technical coding rounds, system design discussions, and executive behavioral conversations.
        </p>
      </div>

      {/* Four Core Pillars Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
        id="about-pillars-grid"
      >
        <div
          className="card"
          style={{
            padding: '1.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Real Candidate Rounds</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Breakdowns of every stage—from recruiter screen to multi-round on-sites—with difficulty benchmarks and preparation advice.
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '1.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💻</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Actual Coding Questions</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Targeted data structure, algorithm, concurrency, and architecture challenges asked by leading tech companies.
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '1.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏢</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Company Insights</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Dedicated company hubs showcasing hiring trends, official profiles, culture philosophies, and real candidate satisfaction.
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '1.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛡️</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Community Integrity</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Strict moderation respecting company non-disclosure agreements, emphasizing constructive learning over leaks.
          </p>
        </div>
      </div>

      {/* Call to Action Banner */}
      <div
        className="card"
        style={{
          padding: '2.5rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
        }}
        id="about-cta"
      >
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
          Join Thousands of Prepared Engineers
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
          Explore interview archives, bookmark challenging rounds, or contribute your own story to guide future candidates.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/experiences" className="btn btn-primary" id="about-btn-browse">
            Explore Experiences →
          </Link>
          <Link to="/companies" className="btn btn-secondary" id="about-btn-companies">
            Browse Companies
          </Link>
        </div>
      </div>
    </div>
  )
}

export default About
