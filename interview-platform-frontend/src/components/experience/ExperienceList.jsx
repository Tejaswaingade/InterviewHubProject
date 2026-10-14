import React from 'react'
import ExperienceCard from './ExperienceCard'
import EmptyState from '../common/EmptyState'

export function ExperienceList({ experiences = [] }) {
  if (!experiences || experiences.length === 0) {
    return <EmptyState title="No Experiences Found" description="Be the first candidate to share your interview experience." />
  }

  return (
    <div className="grid-cards" id="experience-list-grid">
      {experiences.map((exp, idx) => (
        <ExperienceCard key={exp?.id || idx} experience={exp} />
      ))}
    </div>
  )
}

export default ExperienceList
