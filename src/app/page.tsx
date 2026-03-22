'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { TRADE_CONFIG, getQuestionsForProblem, calculateLeadScore } from '@/lib/questionnaire'

type Step = 'trade' | 'problem' | 'quiz' | 'contact' | 'success' | 'contractor'

const LEAD_SCORE_LABELS: Record<string, string> = {
  urgent: '🔥 Hot Lead — Call immediately',
  warm: '⚡ Warm Lead — Contact within the hour',
  cool: '❄️ Cool Lead — Follow up today',
}

export default function Home() {
  const [step, setStep] = useState<Step>('trade')
  const [selectedTrade, setSelectedTrade] = useState('')
  const [selectedProblem, setSelectedProblem] = useState('')
  const [quizData, setQuizData] = useState<Record<string, any>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '', zip_code: '', timeline: '', budget_range: '', preferred_contact_method: 'phone' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leadScore, setLeadScore] = useState(0)
  const [leadId, setLeadId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Contractor signup state
  const [contractorData, setContractorData] = useState({
    name: '', company: '', email: '', phone: '', specialty: '', service_area: '', license_info: '', website: ''
  })
  const [contractorSubmitting, setContractorSubmitting] = useState(false)
  const [contractorSuccess, setContractorSuccess] = useState(false)

  const questions = selectedTrade && selectedProblem ? getQuestionsForProblem(selectedTrade, selectedProblem) : []
  const currentQuestion = questions[currentQuestionIndex]

  function selectTrade(trade: string) {
    setSelectedTrade(trade)
    setSelectedProblem('')
    setQuizData({})
    setPhotos([])
    setPhotoPreviews([])
    setStep('problem')
  }

  function selectProblem(prob: string) {
    setSelectedProblem(prob)
    setQuizData({})
    setCurrentQuestionIndex(0)
    setStep('quiz')
  }

  function handleQuizAnswer(questionId: string, answer: string) {
    setQuizData(prev => ({ ...prev, [questionId]: answer }))
  }

  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setStep('contact')
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else {
      setStep('problem')
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newPhotos = [...photos, ...files].slice(0, 5)
    setPhotos(newPhotos)
    const newPreviews = newPhotos.map(f => URL.createObjectURL(f))
    setPhotoPreviews(newPreviews)
  }

  function removePhoto(index: number) {
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function submitLead() {
    setIsSubmitting(true)
    try {
      const score = calculateLeadScore({ ...quizData, ...contactInfo, images: photos })
      setLeadScore(score)

      const { data, error } = await supabase.from('leads').insert({
        trade: selectedTrade,
        problem_type: selectedProblem,
        description: quizData.prob_desc || '',
        zip_code: contactInfo.zip_code || '',
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        preferred_contact_method: contactInfo.preferred_contact_method || 'phone',
        timeline: contactInfo.timeline,
        budget_range: contactInfo.budget_range,
        scoring: score,
        status: 'new',
      }).select('id').single()

      if (error) throw error
      setLeadId(data.id)

      // Trigger email notifications to contractors
      try {
        await fetch('/api/lead/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: data.id }),
        })
      } catch (e) {
        // Non-blocking — don't affect user experience
        console.error('Email trigger error:', e)
      }

      setStep('success')
    } catch (err) {
      console.error('Lead submission error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitContractor() {
    if (!contractorData.name || !contractorData.email || !contractorData.phone || !contractorData.specialty || !contractorData.service_area) {
      alert('Please fill in all required fields.')
      return
    }
    setContractorSubmitting(true)
    try {
      const { error } = await supabase.from('contractors').insert(contractorData)
      if (error) throw error
      setContractorSuccess(true)
    } catch (err) {
      console.error('Contractor submission error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setContractorSubmitting(false)
    }
  }

  function getScoreLabel(score: number): string {
    if (score >= 70) return LEAD_SCORE_LABELS.urgent
    if (score >= 45) return LEAD_SCORE_LABELS.warm
    return LEAD_SCORE_LABELS.cool
  }

  function canProceed(): boolean {
    if (step === 'contact') {
      return !!(contactInfo.name && contactInfo.phone && contactInfo.zip_code && contactInfo.timeline)
    }
    return true
  }

  function renderStep() {
    if (step === 'success') {
      return (
        <div className="success-screen">
          <div className="success-icon">✅</div>
          <h2>You're All Set!</h2>
          <p>
            We found {selectedTrade.toLowerCase()} contractors in your area ready to help.
            You'll get 3+ quotes within 10 minutes. A contractor or our AI agent will contact you shortly.
          </p>
          <div className="score-display">
            Your lead score: {leadScore}/100 — {getScoreLabel(leadScore)}
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            Reference ID: {leadId}
          </p>
        </div>
      )
    }

    if (step === 'trade') {
      return (
        <div className="form-section">
          <div className="section-label">Step 1 of 4</div>
          <h2 className="section-title">What type of project?</h2>
          <p className="section-sub">Select the trade that best describes your project</p>
          <div className="trade-grid">
            {TRADE_CONFIG.trades.map(trade => (
              <div key={trade} className={`trade-card ${selectedTrade === trade ? 'selected' : ''}`} onClick={() => selectTrade(trade)}>
                <span className="icon">{TRADE_ICONS[trade]}</span>
                {trade}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (step === 'problem') {
      return (
        <div className="form-section">
          <div className="section-label">Step 2 of 4</div>
          <h2 className="section-title">What's the specific issue?</h2>
          <p className="section-sub">Help us match you with the right specialist</p>
          <div className="problem-grid">
            {(TRADE_CONFIG.problems[selectedTrade] || []).map(prob => (
              <div key={prob} className={`problem-card ${selectedProblem === prob ? 'selected' : ''}`} onClick={() => selectProblem(prob)}>
                {prob}
              </div>
            ))}
          </div>
          <button className="btn-secondary" onClick={() => setStep('trade')}>
            ← Back to Trade Selection
          </button>
        </div>
      )
    }

    if (step === 'quiz') {
      const q = currentQuestion
      if (!q) return null
      const currentAnswer = quizData[q.id]

      return (
        <div className="form-section">
          <div className="step-indicator">
            {questions.map((_, i) => (
              <div key={i} className={`step-dot ${i === currentQuestionIndex ? 'active' : i < currentQuestionIndex ? 'done' : ''}`} />
            ))}
          </div>
          <div className="section-label">Question {currentQuestionIndex + 1} of {questions.length}</div>

          <div className="question-block">
            <label>{q.question}</label>

            {q.type === 'multiple_choice' && q.options && (
              <div className="option-list">
                {q.options.map(opt => (
                  <div key={opt} className={`option-pill ${currentAnswer === opt ? 'selected' : ''}`} onClick={() => handleQuizAnswer(q.id, opt)}>
                    <div className="radio" />
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                placeholder="Describe the problem..."
                value={currentAnswer || ''}
                onChange={e => handleQuizAnswer(q.id, e.target.value)}
              />
            )}

            {q.type === 'photo' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
                <div className={`photo-upload ${photoPreviews.length > 0 ? 'has-photo' : ''}`} onClick={() => fileInputRef.current?.click()}>
                  <div className="photo-upload-icon">📷</div>
                  <p>{photoPreviews.length > 0 ? `${photoPreviews.length} photo(s) uploaded — tap to add more` : 'Tap to upload photos (up to 5)'}</p>
                </div>
                {photoPreviews.length > 0 && (
                  <div className="photo-thumbs">
                    {photoPreviews.map((src, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={src} className="photo-thumb" alt="" />
                        <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', color: 'white', lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={prevQuestion} style={{ marginTop: 0 }}>
              ← Back
            </button>
            <button
              className="btn-primary"
              onClick={nextQuestion}
              disabled={q.required && !currentAnswer}
              style={{ marginTop: 0 }}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Continue to Contact Info →' : 'Next →'}
            </button>
          </div>
        </div>
      )
    }

    if (step === 'contact') {
      return (
        <div className="form-section">
          <div className="section-label">Final Step</div>
          <h2 className="section-title">Where should we send your quotes?</h2>
          <p className="section-sub">No spam. No obligation. Just fast, free quotes.</p>

          <div className="question-block">
            <label>Your Name *</label>
            <input
              type="text"
              placeholder="Full name"
              value={contactInfo.name}
              onChange={e => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="contact-fields">
            <div className="row">
              <div className="question-block" style={{ marginBottom: 0 }}>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={contactInfo.email}
                  onChange={e => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="question-block" style={{ marginBottom: 0 }}>
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={contactInfo.phone}
                  onChange={e => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="question-block" style={{ marginBottom: 0 }}>
              <label>ZIP Code *</label>
              <input
                type="text"
                placeholder="Enter your ZIP code"
                value={contactInfo.zip_code}
                onChange={e => setContactInfo(prev => ({ ...prev, zip_code: e.target.value }))}
              />
            </div>
          </div>

          <div className="question-block" style={{ marginTop: 16 }}>
            <label>When do you want to start? *</label>
            <div className="option-list">
              {[
                { val: 'Emergency / Right now', label: '🚨 Emergency / Right now' },
                { val: 'Within 1 week', label: '⚡ Within 1 week' },
                { val: 'Within 2 weeks', label: '📅 Within 2 weeks' },
                { val: 'Within a month', label: '🗓️ Within a month' },
                { val: 'Just browsing', label: '🔍 Just browsing' },
              ].map(opt => (
                <div
                  key={opt.val}
                  className={`option-pill ${contactInfo.timeline === opt.val ? 'selected' : ''}`}
                  onClick={() => setContactInfo(prev => ({ ...prev, timeline: opt.val }))}
                >
                  <div className="radio" />
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <div className="question-block">
            <label>Estimated Budget</label>
            <div className="option-list">
              {[
                { val: 'Under $1,000', label: 'Under $1,000' },
                { val: '$1,000 - $2,000', label: '$1,000 - $2,000' },
                { val: '$2,000 - $5,000', label: '$2,000 - $5,000' },
                { val: '$5,000 - $10,000', label: '$5,000 - $10,000' },
                { val: 'Over $10,000', label: 'Over $10,000' },
                { val: 'Not sure yet', label: 'Not sure yet' },
              ].map(opt => (
                <div
                  key={opt.val}
                  className={`option-pill ${contactInfo.budget_range === opt.val ? 'selected' : ''}`}
                  onClick={() => setContactInfo(prev => ({ ...prev, budget_range: opt.val }))}
                >
                  <div className="radio" />
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <button className="btn-secondary" onClick={() => setStep('quiz')}>
            ← Back to Questions
          </button>
          <button
            className="btn-primary"
            onClick={submitLead}
            disabled={isSubmitting || !canProceed()}
          >
            {isSubmitting ? 'Submitting...' : '🔥 Get My Free Quotes →'}
          </button>
        </div>
      )
    }

    if (step === 'contractor') {
      if (contractorSuccess) {
        return (
          <div className="success-screen">
            <div className="success-icon">🏗️</div>
            <h2>You're In!</h2>
            <p>
              Welcome to the NeedQuotes contractor network. Our team will review your application and get back to you within 24 hours. Once approved, you'll start receiving exclusive leads in your area.
            </p>
            <div className="score-display">
              Application received — we're reviewing now
            </div>
          </div>
        )
      }
      return (
        <div className="form-section">
          <div className="section-label">Contractor Signup</div>
          <h2 className="section-title">Join Our Contractor Network</h2>
          <p className="section-sub">Get exclusive, pre-qualified leads in your service area</p>

          <div className="question-block">
            <label>Your Name *</label>
            <input type="text" placeholder="Full name" value={contractorData.name} onChange={e => setContractorData(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="question-block">
            <label>Company Name *</label>
            <input type="text" placeholder="Company name" value={contractorData.company} onChange={e => setContractorData(prev => ({ ...prev, company: e.target.value }))} />
          </div>
          <div className="contact-fields">
            <div className="row">
              <div className="question-block" style={{ marginBottom: 0 }}>
                <label>Email *</label>
                <input type="email" placeholder="email@company.com" value={contractorData.email} onChange={e => setContractorData(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="question-block" style={{ marginBottom: 0 }}>
                <label>Phone *</label>
                <input type="tel" placeholder="+1 (555) 000-0000" value={contractorData.phone} onChange={e => setContractorData(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="question-block" style={{ marginTop: 16 }}>
            <label>Specialty / Trade *</label>
            <div className="option-list">
              {TRADE_CONFIG.trades.map(trade => (
                <div key={trade} className={`option-pill ${contractorData.specialty === trade ? 'selected' : ''}`} onClick={() => setContractorData(prev => ({ ...prev, specialty: trade }))}>
                  <div className="radio" />
                  {trade}
                </div>
              ))}
            </div>
          </div>

          <div className="question-block">
            <label>Service Area (ZIP codes or cities you serve) *</label>
            <input type="text" placeholder="e.g. 30004, 30075, or Atlanta Metro" value={contractorData.service_area} onChange={e => setContractorData(prev => ({ ...prev, service_area: e.target.value }))} />
          </div>

          <div className="question-block">
            <label>License / Insurance Info (optional)</label>
            <input type="text" placeholder="e.g. GA License #123456, Insured" value={contractorData.license_info} onChange={e => setContractorData(prev => ({ ...prev, license_info: e.target.value }))} />
          </div>

          <div className="question-block">
            <label>Website (optional)</label>
            <input type="text" placeholder="https://yourcompany.com" value={contractorData.website} onChange={e => setContractorData(prev => ({ ...prev, website: e.target.value }))} />
          </div>

          <button className="btn-secondary" onClick={() => setStep('trade')}>
            ← Back
          </button>
          <button className="btn-primary" onClick={submitContractor} disabled={contractorSubmitting}>
            {contractorSubmitting ? 'Submitting...' : '🏗️ Join the Network →'}
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <main>
      <div className="confetti-bar">
        🎉 Exclusive leads — 3+ contractor quotes in under 10 minutes
      </div>

      {step !== 'success' && (
        <div className="hero">
          {step !== 'trade' && (
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              {selectedTrade} → {selectedProblem}
            </div>
          )}
          <h1>
            {step === 'trade' && <>Get <span className="highlight">3+ Quotes</span> in Under 10 Minutes</>}
            {step === 'problem' && <>What's the specific issue?</>}
            {step === 'quiz' && <>A few quick questions</>}
            {step === 'contact' && <>Almost there!</>}
            {step === 'contractor' && <>Join Our Contractor Network</>}
          </h1>
          {step === 'trade' && (
            <p>Answer a few questions, upload a photo, and get matched with top-rated local contractors who compete for your job.</p>
          )}
          {step === 'trade' && (
            <div className="hero-stats">
              <div className="stat">
                <div className="num">50K+</div>
                <div className="label">Projects Completed</div>
              </div>
              <div className="stat">
                <div className="num">8,400+</div>
                <div className="label">Verified Contractors</div>
              </div>
              <div className="stat">
                <div className="num">4.8★</div>
                <div className="label">Average Rating</div>
              </div>
            </div>
          )}
        </div>
      )}

      {renderStep()}

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="step-cards">
          <div className="step-card">
            <div className="step-num">1</div>
            <h4>Tell Us Your Project</h4>
            <p>Answer a few quick questions specific to your problem. Upload a photo for faster, more accurate quotes.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h4>We Match You Fast</h4>
            <p>Our AI instantly matches you with 3+ verified contractors in your area who specialize in your exact job.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h4>You Choose the Best</h4>
            <p>Contractors (or our AI agent) contact you directly. Compare quotes, check reviews, and hire with confidence.</p>
          </div>
        </div>
      </section>

      <div className="contractor-cta">
        <h3>Are You a Contractor?</h3>
        <p>Get exclusive, pre-qualified leads in your service area. Pay only for leads that match your specialty.</p>
        <button className="btn-secondary" onClick={() => setStep('contractor')}>Join as a Contractor →</button>
      </div>

      <footer>
        <p>© 2026 NeedQuotes · <a href="#">Privacy</a> · <a href="#">Terms</a></p>
      </footer>
    </main>
  )
}

const TRADE_ICONS: Record<string, string> = {
  HVAC: '❄️',
  Roofing: '🏠',
  Flooring: '🪵',
  Plumbing: '🔧',
  Electrical: '⚡',
  Painting: '🎨',
  Landscaping: '🌿',
  General: '🔨',
}
