import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FaBaby,
  FaCamera,
  FaChild,
  FaCog,
  FaEdit,
  FaEllipsisH,
  FaEnvelope,
  FaExclamationTriangle,
  FaFileAlt,
  FaFire,
  FaGlobe,
  FaLock,
  FaMoon,
  FaPaperPlane,
  FaPhone,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaTrashAlt,
  FaUser,
  FaUserCircle,
  FaUtensils,
  FaVideo,
} from 'react-icons/fa'
import './App.css'

const homeActions = [
  {
    id: 'children',
    label: 'Children',
    description: 'Check in on schedules and notes.',
    icon: FaChild,
  },
  {
    id: 'user',
    label: 'User',
    description: 'Manage your babysitter profile.',
    icon: FaUserCircle,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Notifications, preferences, and more.',
    icon: FaCog,
  },
  {
    id: 'alert',
    label: 'Alert',
    description: 'Send or review urgent alerts.',
    icon: FaExclamationTriangle,
  },
  {
    id: 'monitor',
    label: 'Monitor',
    description: 'Live video or audio monitor feed.',
    icon: FaVideo,
  },
  {
    id: 'reports',
    label: 'Parent Reports',
    description: 'Send daily activity reports to parents.',
    icon: FaFileAlt,
  },
]

const actionOptions = [
  {
    id: 'nap',
    label: 'Nap',
    icon: FaMoon,
    confirmation: (name) => `Record nap time for ${name}?`,
    success: (name, time) => `${name}: Nap recorded at ${time}`,
  },
  {
    id: 'diaper',
    label: 'Diaper',
    icon: FaBaby,
    confirmation: (name) => `Record diaper change for ${name}?`,
    success: (name, time) => `${name}: Diaper change saved at ${time}`,
  },
  {
    id: 'meal',
    label: 'Meal',
    icon: FaUtensils,
    confirmation: (name) => `Record meal time for ${name}?`,
    success: (name, time) => `${name}: Meal logged at ${time}`,
  },
]

const alertOptions = [
  {
    id: 'fire',
    label: 'Fire',
    icon: FaFire,
    message:
      'A fire alarm has been triggered. Children have been safely evacuated. We are monitoring the situation.',
  },
  {
    id: 'lockdown',
    label: 'Lockdown',
    icon: FaLock,
    message:
      'A precautionary lockdown is in effect. All doors are secured and everyone is safe in designated areas.',
  },
  {
    id: 'stranger',
    label: 'Stranger',
    icon: FaUser,
    message:
      'A stranger has been reported in the facility. Authorities have been contacted and safety protocols are active.',
  },
  {
    id: 'other',
    label: 'Other',
    icon: FaEllipsisH,
    message: '',
  },
]

function HomePage({ onNavigate }) {
  return (
    <main className="home-shell">
      <div className="home-card">
        <header className="home-header">
          <p className="eyebrow">Babysitter Companion</p>
          <h1>Home</h1>
          <p className="subtitle">Pick the tool you need right now.</p>
        </header>

        <section aria-label="Quick actions" className="actions-grid">
          {homeActions.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="action-card"
              onClick={() => onNavigate(id)}
            >
              <span className="icon-circle" aria-hidden="true">
                <Icon />
              </span>
              <span className="action-label">{label}</span>
              <span className="action-desc">{description}</span>
            </button>
          ))}
        </section>
      </div>
    </main>
  )
}

function AlertPage({ onBack, childrenProfiles }) {
  const [selectedId, setSelectedId] = useState(alertOptions[0].id)
  const [messageDrafts, setMessageDrafts] = useState(() =>
    Object.fromEntries(alertOptions.map((opt) => [opt.id, opt.message])),
  )
  const [isEditing, setIsEditing] = useState(false)
  const [sentToast, setSentToast] = useState('')
  const [pendingSend, setPendingSend] = useState(null)
  const [isTranslatingAlerts, setIsTranslatingAlerts] = useState(false)
  const [alertMessagesPreview, setAlertMessagesPreview] = useState(null)

  const selectedAlert = alertOptions.find((alert) => alert.id === selectedId)
  const SelectedIcon = selectedAlert?.icon ?? null
  const messageValue = messageDrafts[selectedId] ?? ''
  const isOther = selectedAlert?.id === 'other'
  const sendDisabled = !messageValue.trim()

  useEffect(() => {
    if (!sentToast) return
    const timeout = setTimeout(() => setSentToast(''), 2500)
    return () => clearTimeout(timeout)
  }, [sentToast])

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev)
  }

  const handleMessageChange = (event) => {
    const nextMessage = event.target.value
    setMessageDrafts((prev) => ({ ...prev, [selectedId]: nextMessage }))
  }

  const handleSendRequest = () => {
    if (sendDisabled) return
    setPendingSend({ alertId: selectedId })
  }

  const handleConfirmSend = async () => {
    if (!pendingSend) return
  
    const alert = alertOptions.find((opt) => opt.id === pendingSend.alertId)
    if (!alert) {
      setPendingSend(null)
      return
    }
  
    const baseMessage = (messageDrafts[pendingSend.alertId] || '').trim()
    if (!baseMessage) {
    setPendingSend(null)
      return
    }
  
    const childrenWithPhones = (childrenProfiles || []).filter(
      (child) => child.parentPhone && child.parentPhone.trim(),
    )
  
    if (childrenWithPhones.length === 0) {
      setPendingSend(null)
      setSentToast('No parent phone numbers found. Add phone numbers under Children.')
      return
    }
  
    setPendingSend(null)
    setIsTranslatingAlerts(true)
  
    try {
      const alerts = await Promise.all(
        childrenWithPhones.map(async (child) => {
          const code = child.parentLanguage || 'en'
          const customName =
            child.parentLanguage === 'other' && child.parentLanguageCustomName
              ? child.parentLanguageCustomName.trim()
              : null
  
          const targetLanguageForAI = customName || code
  
          const translatedMessage = await translateReportWithAI(
            baseMessage,
            targetLanguageForAI,
          )
  
          return {
            childId: child.id,
            childName: child.name,
            phone: child.parentPhone,
            language: targetLanguageForAI,
            translatedMessage,
          }
        }),
      )
  
      setAlertMessagesPreview({ alerts })
      setIsEditing(false)
    } catch (err) {
      console.error('Error translating alert for parents', err)
      setSentToast('Failed to translate alert. Please try again.')
    } finally {
      setIsTranslatingAlerts(false)
    }
  }

  const handleSendAlertToAll = () => {
    setAlertMessagesPreview(null)
    setSentToast('Message sent to all parents.')
  }
  

  const handleSelect = (id) => {
    setSelectedId(id)
    setIsEditing(id === 'other')
  }

  return (
    <main className="alert-shell">
      <div className="alert-card">
        <header className="alert-header">
          <button type="button" className="back-link" onClick={onBack}>
            Back
          </button>
          <h1>Alert Options</h1>
        </header>

        <div className="alert-body">
          <aside className="alert-options">
            {alertOptions.map((option) => {
              const Icon = option.icon
              const isActive = option.id === selectedId
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`alert-option ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelect(option.id)}
                >
                  <Icon aria-hidden="true" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </aside>

          {selectedAlert && (
            <section className="alert-detail">
              <div className="alert-banner">Emergency Alert</div>
              <div className="alert-message-card">
                <div className="alert-message-title">
                  {SelectedIcon && (
                    <span className="alert-message-icon" aria-hidden="true">
                      <SelectedIcon />
                    </span>
                  )}
                  <div>
                    <p className="alert-type-label">{selectedAlert.label} Alert Message</p>
                    {isOther && <p className="alert-hint">Fill in the details for this alert.</p>}
                  </div>
                </div>
                <textarea
                  value={messageValue}
                  onChange={handleMessageChange}
                  placeholder="Describe the situation..."
                  readOnly={!isEditing}
                />
              </div>

              <div className="alert-actions">
                <button
                  type="button"
                  className="alert-send"
                  disabled={sendDisabled || isTranslatingAlerts}
                  onClick={handleSendRequest}
                >
                  Send
                </button>
                <button
                  type="button"
                  className="alert-edit"
                  onClick={handleEditToggle}
                >
                  {isEditing ? 'Lock' : 'Edit'}
                </button>
              </div>

              <button type="button" className="alert-cancel" onClick={onBack}>
                Cancel
              </button>
            </section>
          )}
        </div>
      </div>

      {alertMessagesPreview && (
        <div className="confirm-layer" role="dialog" aria-modal="true">
          <div className="sms-preview-modal">
            <h2>Alert Messages</h2>
            <p className="alert-hint">
              One message was prepared for each parent based on their saved language.
            </p>

            <div className="sms-preview-content">
              {alertMessagesPreview.alerts.map((item) => (
                <div
                  key={item.childId}
                  style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.3)',
                    paddingBottom: '0.75rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>{item.childName}</span>
                    <span>{item.phone}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      marginBottom: '0.35rem',
                      color: '#6b7280',
                    }}
                  >
                    Language: {item.language}
                  </div>
                  <div>{item.translatedMessage}</div>
                </div>
              ))}
            </div>

            <div className="sms-preview-buttons">
              <button type="button" onClick={() => setAlertMessagesPreview(null)}>
                Cancel
              </button>
              <button type="button" onClick={handleSendAlertToAll}>
                Send to all
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingSend && (
        <div className="confirm-layer" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <p>
              Send{' '}
              {alertOptions.find((opt) => opt.id === pendingSend.alertId)?.label ??
                'this'}{' '}
              alert now?
            </p>
            <div className="confirm-buttons">
              <button
                type="button"
                className="confirm-yes"
                onClick={handleConfirmSend}
              >
                Yes
              </button>
              <button
                type="button"
                className="confirm-no"
                onClick={() => setPendingSend(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {sentToast && (
        <div className="alert-toast" role="status">
          {sentToast}
        </div>
      )}
    </main>
  )
}


const FAVORITE_COLORS = [
  '#f4c987', // yellow (Timmy's color)
  '#f8b4d9', // pink (Lily's color)
  '#f8e08e', // light yellow (Max's color)
  '#a8d5ba', // mint green
  '#ffb6b9', // soft coral
  '#c5a3ff', // lavender
  '#ffd194', // peach
  '#b4e7f5', // sky blue
]

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
]

const TRANSLATION_TEMPLATES = {
  header: {
    en: 'Daily Report for {name} - {date}',
    es: 'Informe Diario de {name} - {date}',
    zh: '{name}的每日报告 - {date}',
    hi: '{name} के लिए दैनिक रिपोर्ट - {date}',
    ar: 'تقرير يومي ل {name} - {date}',
    fr: 'Rapport Quotidien pour {name} - {date}',
    ru: 'Ежедневный Отчет для {name} - {date}',
    pt: 'Relatório Diário de {name} - {date}',
    de: 'Täglicher Bericht für {name} - {date}',
    ja: '{name}の毎日のレポート - {date}',
  },
  footer: {
    en: '- Your Babysitter',
    es: '- Su Niñera',
    zh: '- 您的保姆',
    hi: '- आपकी बेबीसिटर',
    ar: '- جليسة الأطفال الخاصة بك',
    fr: '- Votre Nounou',
    ru: '- Ваша Няня',
    pt: '- Sua Babá',
    de: '- Ihr Babysitter',
    ja: '- あなたのベビーシッター',
  },
  noActivities: {
    en: 'No activities recorded today for {name}.',
    es: 'No se registraron actividades hoy para {name}.',
    zh: '今天没有记录{name}的活动。',
    hi: 'आज {name} के लिए कोई गतिविधि दर्ज नहीं की गई।',
    ar: 'لم يتم تسجيل أي أنشطة اليوم ل {name}.',
    fr: 'Aucune activité enregistrée aujourd\'hui pour {name}.',
    ru: 'Сегодня не зарегистрировано действий для {name}.',
    pt: 'Nenhuma atividade registrada hoje para {name}.',
    de: 'Heute wurden keine Aktivitäten für {name} aufgezeichnet.',
    ja: '今日は{name}のアクティビティが記録されていません。',
  },
  activityTypes: {
    Nap: {
      en: 'Nap',
      es: 'Siesta',
      zh: '午睡',
      hi: 'झपकी',
      ar: 'قيلولة',
      fr: 'Sieste',
      ru: 'Сон',
      pt: 'Cochilo',
      de: 'Nickerchen',
      ja: '昼寝',
    },
    Diaper: {
      en: 'Diaper',
      es: 'Pañal',
      zh: '尿布',
      hi: 'डायपर',
      ar: 'حفاضات',
      fr: 'Couche',
      ru: 'Подгузник',
      pt: 'Fralda',
      de: 'Windel',
      ja: 'おむつ',
    },
    Meal: {
      en: 'Meal',
      es: 'Comida',
      zh: '进餐',
      hi: 'भोजन',
      ar: 'وجبة',
      fr: 'Repas',
      ru: 'Еда',
      pt: 'Refeição',
      de: 'Mahlzeit',
      ja: '食事',
    },
  },
  phrases: {
    'recorded at': {
      en: 'recorded at',
      es: 'registrado a las',
      zh: '记录于',
      hi: 'पर दर्ज किया गया',
      ar: 'سجلت في',
      fr: 'enregistré à',
      ru: 'записано в',
      pt: 'registrado às',
      de: 'aufgezeichnet um',
      ja: 'に記録されました',
    },
    'ended at': {
      en: 'ended at',
      es: 'terminó a las',
      zh: '结束于',
      hi: 'पर समाप्त हुआ',
      ar: 'انتهى في',
      fr: 'terminé à',
      ru: 'закончилось в',
      pt: 'terminou às',
      de: 'endete um',
      ja: 'に終了しました',
    },
    note: {
      en: 'Note',
      es: 'Nota',
      zh: '备注',
      hi: 'नोट',
      ar: 'ملاحظة',
      fr: 'Remarque',
      ru: 'Заметка',
      pt: 'Observação',
      de: 'Hinweis',
      ja: 'メモ',
    },
  },
}

// Initial activities for historical data (these remain hardcoded as they're runtime data)
const initialActivities = {
  timmy: [
      { timestamp: '2025-12-02T14:45:00', label: 'Nap ended at 2:45 PM' },
      { timestamp: '2025-12-02T11:15:00', label: 'Diaper changed at 11:15 AM' },
      { timestamp: '2025-12-02T08:30:00', label: 'Meal at 8:30 AM' },
      { timestamp: '2025-10-29T09:41:00', label: 'Nap ended at 9:41 AM' },
      { timestamp: '2025-10-29T09:29:00', label: 'Diaper changed at 9:29 AM' },
      { timestamp: '2025-10-29T08:36:00', label: 'Meal at 8:36 AM' },
      { timestamp: '2025-10-28T17:42:00', label: 'Meal at 5:42 PM' },
    ],
  katie: [
      { timestamp: '2025-10-29T10:15:00', label: 'Meal at 10:15 AM' },
      { timestamp: '2025-10-29T08:50:00', label: 'Diaper changed at 8:50 AM' },
    ],
  Jimmy: [
      { timestamp: '2025-10-29T09:05:00', label: 'Nap ended at 9:05 AM' },
      { timestamp: '2025-10-28T19:12:00', label: 'Meal at 7:12 PM' },
    ],
}

// Parse CSV text into array of objects
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = []
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines
    
    // Simple CSV parsing - split by comma and trim each value
    // Note: This doesn't handle quoted values with commas inside them
    const values = line.split(',').map(v => v.trim())
    
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} values but expected ${headers.length}`)
      continue
    }
    
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    rows.push(row)
  }
  
  return rows
}

// Load children profiles from CSV file
async function loadChildrenFromCSV() {
  try {
    const response = await fetch('/children.csv')
    if (!response.ok) {
      throw new Error('Failed to load children.csv')
    }
    const csvText = await response.text()
    const rows = parseCSV(csvText)
    
    // Convert CSV rows to children profiles format
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      favoriteColor: row.favoriteColor,
      activities: initialActivities[row.id] || [],
      parentLanguage: row.parentLanguage || 'en',
      parentLanguageCustomName: row.parentLanguageCustomName || '',
      parentPhone: row.parentPhone || '',
    }))
  } catch (error) {
    console.error('Error loading children from CSV:', error)
    // Return empty array or fallback data
    return []
  }
}

// Note: Children profiles are only stored in CSV file, not localStorage

const CHILD_LOGS_STORAGE_KEY = 'babysitter_child_logs'

function saveChildLogsToLocalStorage(logs) {
  try {
    localStorage.setItem(CHILD_LOGS_STORAGE_KEY, JSON.stringify(logs))
  } catch (error) {
    console.error('Error saving child logs to localStorage:', error)
  }
}

function loadChildLogsFromLocalStorage() {
  try {
    const stored = localStorage.getItem(CHILD_LOGS_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading child logs from localStorage:', error)
    return null
  }
}

// Convert children array to CSV format
function childrenToCSV(children) {
  const headers = 'id,name,avatar,favoriteColor,parentLanguage,parentLanguageCustomName,parentPhone\n'

  const rows = children.map(child => {
    // Use default avatar if it's a blob URL or data URL (can't be saved in CSV easily)
    let avatar = child.avatar
    if (child.avatar.startsWith('blob:') || child.avatar.startsWith('data:')) {
      avatar = '/default-avatar.svg'
    }
    // Escape commas in values if needed
    const escapeCSV = (value) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }
    return `${escapeCSV(child.id)},${escapeCSV(child.name)},${escapeCSV(avatar)},${escapeCSV(child.favoriteColor)},${escapeCSV(child.parentLanguage || 'en')},${escapeCSV(child.parentLanguageCustomName || '')},${escapeCSV(child.parentPhone || '')}`
  }).join('\n')
  return headers + rows
}

// Save CSV file to server (if backend available)
// Note: In a frontend-only app, this will silently fail if no backend exists.
// The CSV file in public/children.csv remains the source of truth.
async function saveCSV(children) {
  const csvContent = childrenToCSV(children)
  
  // Try to save to server (if backend API exists)
  try {
    const response = await fetch('/api/save-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ csvContent }),
    })
    
    if (response.ok) {
      return // Successfully saved to server
    }
  } catch (error) {
    // Backend not available - silently fail (no automatic download)
    // The CSV file in public/children.csv is the source of truth
    console.log('Backend not available. CSV changes are in memory only.')
  }
}

// Download CSV file (for manual export)
function downloadCSV(children) {
  const csvContent = childrenToCSV(children)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', 'children.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Load children from CSV file (only source of truth)
async function loadAllChildren() {
  return await loadChildrenFromCSV()
}

const defaultBabysitterProfile = {
  id: 'babysitter_001',
  name: 'Sarah Johnson',
  photo: '/babysitter-profile.jpg',
  email: 'sarah.johnson@email.com',
  phone: '(555) 123-4567',
}

function generateChildId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `child_${timestamp}_${random}`
}

function getRandomColor() {
  return FAVORITE_COLORS[Math.floor(Math.random() * FAVORITE_COLORS.length)]
}

function groupActivities(activities) {
  return activities.reduce((groups, activity) => {
    const dateKey = new Date(activity.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(activity)
    return groups
  }, {})
}

function formatParentReport(childName, activities) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const header = `Daily Report for ${childName} - ${date}`

  if (activities.length === 0) {
    const noActivities = `No activities were recorded for ${childName} today.`
    const footer = '- Your Babysitter'
    return `${header}\n\n${noActivities}\n\n${footer}`
  }

  let message = `${header}\n\n`

  activities.forEach((activity, index) => {
    message += `${index + 1}. ${activity.label}\n`

    if (activity.note) {
      message += `- Note: ${activity.note}\n`
    }
  })

  message += `\n- Your Babysitter`

  return message
}

function getLanguageNameFromCode(code) {
  const match = SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
  return match ? match.name : code
}
async function translateReportWithAI(message, targetLanguageCode) {
  if (targetLanguageCode === 'en') {
    return message
  }

  const targetLanguageName = getLanguageNameFromCode(targetLanguageCode)

  const NOGGIN_URL = 'Your_URL'
  const NOGGIN_API_KEY = 'YOUR_API'

  try {
    const response = await fetch(NOGGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NOGGIN_API_KEY}`,
      },
      body: JSON.stringify({
        message,
        target_language: targetLanguageName,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Translation request failed', response.status, errorText)
      return message
    }
    const translatedText = await response.text()

    if (!translatedText || typeof translatedText !== 'string') {
      return message
    }

    return translatedText.trim()
  } catch (err) {
    console.error('Error while translating report', err)
    return message
  }
}

async function buildTranslatedParentReport(childName, activities, targetLanguageCode) {
  const englishMessage = formatParentReport(childName, activities)
  return translateReportWithAI(englishMessage, targetLanguageCode)
}


function TimePicker({ initialHour, initialMinute, initialPeriod, onChange }) {
  const now = new Date()
  const currentHour12 = now.getHours() % 12 || 12
  const currentMinute = now.getMinutes()
  const currentPeriod = now.getHours() >= 12 ? 'PM' : 'AM'
  
  const [hour, setHour] = useState(initialHour || currentHour12)
  const [minute, setMinute] = useState(initialMinute ?? currentMinute)
  const [period, setPeriod] = useState(initialPeriod || currentPeriod)
  const previousMinuteRef = useRef(initialMinute ?? currentMinute)
  const previousHourRef = useRef(initialHour || currentHour12)
  
  const hourRef = useRef(null)
  const minuteRef = useRef(null)
  const hourScrollTimeoutRef = useRef(null)
  const minuteScrollTimeoutRef = useRef(null)

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const periods = ['AM', 'PM']

  const ITEM_HEIGHT = 40
  const REPEATS = 50 // Number of times to repeat the list for infinite scroll
  const OFFSET = Math.floor(REPEATS / 2) // Start in the middle

  // Handle hour changes and toggle AM/PM when crossing 12
  const handleHourChange = (newHour) => {
    const prevHour = previousHourRef.current
    
    // Detect crossing 12 boundaries - both directions toggle
    if ((prevHour === 12 && newHour === 11) || (prevHour === 11 && newHour === 12)) {
      // Crossing 12:00 boundary in either direction should toggle period
      // 12:00 AM <-> 11:59 PM and 12:00 PM <-> 11:59 AM
      setPeriod(period === 'AM' ? 'PM' : 'AM')
    }
    
    previousHourRef.current = newHour
    setHour(newHour)
  }

  // Handle minute changes and adjust hour when wrapping
  const handleMinuteChange = (newMinute) => {
    const prevMinute = previousMinuteRef.current
    
    // Detect wrap-around: 0 -> 59 (rolling backward) or 59 -> 0 (rolling forward)
    // Only adjust hour if we actually wrapped around the boundary
    if (prevMinute === 0 && newMinute === 59) {
      // Rolling backward: decrement hour
      adjustHour(-1, true)
      previousMinuteRef.current = newMinute
    } else if (prevMinute === 59 && newMinute === 0) {
      // Rolling forward: increment hour
      adjustHour(1, true)
      previousMinuteRef.current = newMinute
    } else {
      // Normal change, no wrap-around
      previousMinuteRef.current = newMinute
    }
    
    setMinute(newMinute)
  }

  // Adjust hour (and period if needed when crossing 12)
  const adjustHour = (delta, fromMinuteWrap = false) => {
    const currentHour24 = period === 'PM' && hour !== 12 ? hour + 12 : period === 'AM' && hour === 12 ? 0 : hour
    let newHour24 = currentHour24 + delta
    
    // Handle 24-hour wrapping
    if (newHour24 < 0) {
      newHour24 = 23
    } else if (newHour24 >= 24) {
      newHour24 = 0
    }
    
    // Convert back to 12-hour format
    let newHour12 = newHour24 % 12 || 12
    let newPeriod = newHour24 >= 12 ? 'PM' : 'AM'
    
    // When minute wraps and hour crosses 12, toggle period
    if (fromMinuteWrap) {
      if ((hour === 12 && newHour12 === 11) || (hour === 11 && newHour12 === 12)) {
        // Crossing 12:00 boundary in either direction: toggle period
        newPeriod = period === 'AM' ? 'PM' : 'AM'
      }
    }
    
    previousHourRef.current = newHour12
    setHour(newHour12)
    if (newPeriod !== period) {
      setPeriod(newPeriod)
    }
    
    // Update hour wheel scroll position smoothly
    if (hourRef.current) {
      const index = hours.indexOf(newHour12)
      const scrollPos = (OFFSET * hours.length + index) * ITEM_HEIGHT
      hourRef.current.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const hour24 = period === 'PM' && hour !== 12 ? hour + 12 : period === 'AM' && hour === 12 ? 0 : hour
    onChange(hour24, minute)
  }, [hour, minute, period, onChange])

  // Callback refs to set scroll position immediately when element mounts
  const setHourRef = (element) => {
    hourRef.current = element
    if (element) {
      // Use a flag to prevent multiple initializations
      if (!element.dataset.initialized) {
        // Temporarily disable smooth scrolling
        element.style.scrollBehavior = 'auto'
        const index = hours.indexOf(hour)
        const scrollPos = (OFFSET * hours.length + index) * ITEM_HEIGHT
        // Set immediately without animation
        element.scrollTop = scrollPos
        element.dataset.initialized = 'true'
        // Re-enable smooth scrolling after a microtask
        Promise.resolve().then(() => {
          if (element) {
            element.style.scrollBehavior = ''
          }
        })
      }
    }
  }

  const setMinuteRef = (element) => {
    minuteRef.current = element
    if (element) {
      if (!element.dataset.initialized) {
        element.style.scrollBehavior = 'auto'
        const index = minutes.indexOf(minute)
        const scrollPos = (OFFSET * minutes.length + index) * ITEM_HEIGHT
        element.scrollTop = scrollPos
        element.dataset.initialized = 'true'
        Promise.resolve().then(() => {
          if (element) {
            element.style.scrollBehavior = ''
          }
        })
      }
    }
  }


  const handleScroll = (e, setter, values, wheelRef, timeoutRef) => {
    const scrollTop = e.target.scrollTop
    const itemIndex = Math.round(scrollTop / ITEM_HEIGHT)
    const normalizedIndex = ((itemIndex % values.length) + values.length) % values.length
    const value = values[normalizedIndex]
    setter(value)

    // Reset scroll position when getting too far from center (infinite scroll trick)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (wheelRef.current && !wheelRef.current._isScrolling) {
        const currentScroll = wheelRef.current.scrollTop
        const currentIndex = Math.round(currentScroll / ITEM_HEIGHT)
        const offsetIndex = OFFSET * values.length
        const distanceFromCenter = currentIndex - offsetIndex - normalizedIndex
        
        // If we've scrolled more than half the list length away, reset to center
        if (Math.abs(distanceFromCenter) > values.length) {
          const newScrollPos = (OFFSET * values.length + normalizedIndex) * ITEM_HEIGHT
          wheelRef.current.scrollTop = newScrollPos
        }
      }
      if (wheelRef.current) {
        wheelRef.current._isScrolling = false
      }
    }, 150)
  }

  const handleWheelScroll = (e, wheelRef, setter, values, currentValue) => {
    e.preventDefault()
    if (!wheelRef.current) return
    
    wheelRef.current._isScrolling = true
    const delta = e.deltaY > 0 ? 1 : -1
    const currentIndex = values.indexOf(currentValue)
    let newIndex = currentIndex + delta
    
    // Circular wrapping
    if (newIndex < 0) {
      newIndex = values.length - 1
    } else if (newIndex >= values.length) {
      newIndex = 0
    }
    
    setter(values[newIndex])
    
    // Get current scroll position
    const currentScroll = wheelRef.current.scrollTop
    const currentItemIndex = Math.round(currentScroll / ITEM_HEIGHT)
    const offsetIndex = OFFSET * values.length
    
    // Calculate new position maintaining the offset
    const currentOffsetPosition = currentItemIndex - offsetIndex
    let newOffsetPosition = currentOffsetPosition + delta
    
    // Handle wrapping at boundaries
    if (newOffsetPosition < 0) {
      newOffsetPosition = values.length - 1
    } else if (newOffsetPosition >= values.length) {
      newOffsetPosition = 0
    }
    
    // Scroll to new position
    const newScrollPos = (offsetIndex + newOffsetPosition) * ITEM_HEIGHT
    wheelRef.current.scrollTop = newScrollPos
  }

  const handleItemClick = (value, setter, values, wheelRef) => {
    setter(value)
    const index = values.indexOf(value)
    if (wheelRef.current) {
      const scrollPos = (OFFSET * values.length + index) * ITEM_HEIGHT
      wheelRef.current.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      })
    }
  }

  // Create repeated arrays for infinite scroll effect
  const repeatedHours = Array(REPEATS).fill(hours).flat()
  const repeatedMinutes = Array(REPEATS).fill(minutes).flat()

  return (
    <div className="time-picker">
      <div className="time-picker-wheels">
        <div className="time-wheel-container">
          <div 
            ref={setHourRef}
            className="time-wheel" 
            onScroll={(e) => handleScroll(e, handleHourChange, hours, hourRef, hourScrollTimeoutRef)}
            onWheel={(e) => handleWheelScroll(e, hourRef, handleHourChange, hours, hour)}
          >
            <div style={{ height: '80px' }} />
            {repeatedHours.map((h, idx) => (
              <div
                key={`hour-${idx}`}
                className={`time-wheel-item ${h === hour ? 'selected' : ''}`}
                onClick={() => handleItemClick(h, handleHourChange, hours, hourRef)}
              >
                {h.toString().padStart(2, '0')}
              </div>
            ))}
            <div style={{ height: '80px' }} />
          </div>
          <div className="time-wheel-label">Hour</div>
        </div>

        <div className="time-wheel-container">
          <div 
            ref={setMinuteRef}
            className="time-wheel" 
            onScroll={(e) => handleScroll(e, handleMinuteChange, minutes, minuteRef, minuteScrollTimeoutRef)}
            onWheel={(e) => handleWheelScroll(e, minuteRef, handleMinuteChange, minutes, minute)}
          >
            <div style={{ height: '80px' }} />
            {repeatedMinutes.map((m, idx) => (
              <div
                key={`min-${idx}`}
                className={`time-wheel-item ${m === minute ? 'selected' : ''}`}
                onClick={() => handleItemClick(m, handleMinuteChange, minutes, minuteRef)}
              >
                {m.toString().padStart(2, '0')}
              </div>
            ))}
            <div style={{ height: '80px' }} />
          </div>
          <div className="time-wheel-label">Min</div>
        </div>

        <div className="time-wheel-container period-toggle-container">
          <div className="period-toggle">
            <button
              type="button"
              className={`period-toggle-button ${period === 'AM' ? 'active' : ''}`}
              onClick={() => setPeriod('AM')}
            >
              AM
            </button>
            <button
              type="button"
              className={`period-toggle-button ${period === 'PM' ? 'active' : ''}`}
              onClick={() => setPeriod('PM')}
            >
              PM
            </button>
          </div>
          <div className="time-wheel-label">Period</div>
        </div>
      </div>
    </div>
  )
}

function ChildDetailPage({ childId, onBack, childLogs, setChildLogs, childrenProfiles, setChildrenProfiles }) {
  const [pendingAction, setPendingAction] = useState(null)
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [useCurrentTime, setUseCurrentTime] = useState(true)
  const [selectedHour, setSelectedHour] = useState(null)
  const [selectedMinute, setSelectedMinute] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')


  useEffect(() => {
    if (!confirmationMessage) return
    const timeout = setTimeout(() => setConfirmationMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [confirmationMessage])

  const selectedChild = childrenProfiles.find((child) => child.id === childId)

  const groupedActivities = useMemo(
    () => groupActivities(childLogs[childId] ?? []),
    [childLogs, childId],
  )

  const handleActionClick = (action) => {
    setPendingAction({ childId: childId, action })
    setUseCurrentTime(true)
    const now = new Date()
    setSelectedHour(now.getHours())
    setSelectedMinute(now.getMinutes())
    setNoteDraft('')
  }

  const handleTimeChange = (hour24, minute) => {
    setSelectedHour(hour24)
    setSelectedMinute(minute)
  }

  const handleConfirmAction = () => {
    if (!pendingAction) return
    const child = childrenProfiles.find((c) => c.id === pendingAction.childId)
    
    let selectedDate
    let timeDisplay
    
    if (useCurrentTime) {
      selectedDate = new Date()
      timeDisplay = selectedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else {
      // Create a date with the selected time for today
      selectedDate = new Date()
      selectedDate.setHours(selectedHour, selectedMinute, 0, 0)
      const hour12 = selectedHour % 12 || 12
      const period = selectedHour >= 12 ? 'PM' : 'AM'
      timeDisplay = `${hour12}:${selectedMinute.toString().padStart(2, '0')} ${period}`
    }
    
    const logEntry = {
      timestamp: selectedDate.toISOString(),
      label: `${pendingAction.action.label} recorded at ${timeDisplay}`,
      note: noteDraft.trim() ? noteDraft.trim() : undefined,
    }
    setChildLogs((prev) => ({
      ...prev,
      [pendingAction.childId]: [logEntry, ...(prev[pendingAction.childId] ?? [])],
    }))
    setConfirmationMessage(pendingAction.action.success(child.name, timeDisplay))
    setPendingAction(null)
    setUseCurrentTime(true)
  }

  const handleDeleteChildRequest = () => {
    if (!selectedChild) return
    setDeleteConfirmation({
      type: 'child',
      childId: selectedChild.id,
      message: `Delete ${selectedChild.name}? All activities will be removed.`,
    })
  }

  const handleDeleteActivityRequest = (timestamp, index) => {
    setDeleteConfirmation({
      type: 'activity',
      timestamp,
      index,
      message: 'Delete this activity?',
    })
  }

  const handleClearAllActivitiesRequest = () => {
    if (!selectedChild) return
    setDeleteConfirmation({
      type: 'all-activities',
      message: `Clear all activities for ${selectedChild.name}? This cannot be undone.`,
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteConfirmation) return

    switch (deleteConfirmation.type) {
      case 'child': {
        const childId = deleteConfirmation.childId
        const child = childrenProfiles.find((c) => c.id === childId)

        const updatedProfiles = childrenProfiles.filter((c) => c.id !== childId)
        setChildrenProfiles(updatedProfiles)

        setChildLogs((prev) => {
          const updated = { ...prev }
          delete updated[childId]
          return updated
        })

        if (child?.avatar.startsWith('blob:')) {
          URL.revokeObjectURL(child.avatar)
        }

        // Save CSV file (to server if available)
        setTimeout(async () => {
          await saveCSV(updatedProfiles)
        }, 500)

        setConfirmationMessage(`${child.name} has been deleted`)
        setTimeout(() => {
          onBack()
        }, 500)
        break
      }

      case 'activity': {
        const { timestamp, index } = deleteConfirmation
        setChildLogs((prev) => ({
          ...prev,
          [childId]: prev[childId].filter(
            (act, i) => !(act.timestamp === timestamp && i === index),
          ),
        }))
        setConfirmationMessage('Activity deleted')
        break
      }

      case 'all-activities': {
        setChildLogs((prev) => ({
          ...prev,
          [childId]: [],
        }))
        setConfirmationMessage('All activities cleared')
        break
      }
    }

    setDeleteConfirmation(null)
  }

  const handlePhoneEdit = () => {
    setPhoneInput(selectedChild?.parentPhone || '')
    setEditingPhone(true)
  }

  const handlePhoneSave = () => {
    if (!selectedChild) return

    const cleanPhone = phoneInput.replace(/\D/g, '')
    
    if (cleanPhone.length !== 10 && cleanPhone.length !== 0) {
      setConfirmationMessage('Please enter a valid 10-digit phone number')
      return
    }

    const formattedPhone =
      cleanPhone.length === 10
        ? `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
        : ''

    const updatedProfiles = childrenProfiles.map((child) =>
      child.id === childId ? { ...child, parentPhone: formattedPhone } : child
    )
    
    setChildrenProfiles(updatedProfiles)
    setEditingPhone(false)
    setPhoneInput('')

    // Save CSV file (to server if available)
    setTimeout(async () => {
      await saveCSV(updatedProfiles)
    }, 500)

    setConfirmationMessage('Parent phone number updated')
  }

  const handlePhoneCancel = () => {
    setEditingPhone(false)
    setPhoneInput('')
  }

  if (!selectedChild) {
  return (
    <main className="children-shell">
      <div className="children-card">
        <header className="children-header">
          <button type="button" className="back-link" onClick={onBack}>
            Back
          </button>
            <h1>Child Not Found</h1>
        </header>
        </div>
      </main>
    )
  }

  return (
    <main className="children-shell">
      <div className="children-card">
        <header className="children-header">
          <button type="button" className="back-link" onClick={onBack}>
            Back
            </button>
          <div className="children-header-title">
            <h1>{selectedChild.name}</h1>
            </div>
        </header>

        <div className="child-detail-content">
            <section className="child-details">
              <div className="child-hero">
                <div className="child-hero-avatar" style={{ borderColor: selectedChild.favoriteColor }}>
                  <img src={selectedChild.avatar} alt={`${selectedChild.name} portrait`} />
                </div>
                <div>
                  <p className="child-overline">Currently viewing</p>
                  <h2>{selectedChild.name}</h2>
                </div>
              </div>

              <div className="parent-phone-section">
                <label className="parent-phone-label">Parent Phone Number</label>
                {editingPhone ? (
                  <div className="parent-phone-edit">
                    <input
                      type="tel"
                      className="parent-phone-input"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="(555) 123-4567"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePhoneSave()
                        if (e.key === 'Escape') handlePhoneCancel()
                      }}
                    />
                    <div className="parent-phone-buttons">
                      <button
                        type="button"
                        className="parent-phone-save"
                        onClick={handlePhoneSave}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="parent-phone-cancel"
                        onClick={handlePhoneCancel}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="parent-phone-display">
                    <span className="parent-phone-value">
                      {selectedChild.parentPhone || 'No phone number'}
                    </span>
                    <button
                      type="button"
                      className="parent-phone-edit-button"
                      onClick={handlePhoneEdit}
                    >
                      <FaEdit aria-hidden="true" />
                      <span>{selectedChild.parentPhone ? 'Edit' : 'Add'}</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="delete-child-button"
                onClick={handleDeleteChildRequest}
              >
                <FaTrash aria-hidden="true" />
                <span>Delete Child</span>
              </button>

              <div className="child-actions">
                {actionOptions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      type="button"
                      className="child-action-chip"
                      onClick={() => handleActionClick(action)}
                    >
                      <Icon aria-hidden="true" />
                      <span>{action.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="activity-log">
                <div className="activity-log-header">
                  <h3>Activities</h3>
                {childLogs[childId]?.length > 0 && (
                    <button
                      type="button"
                      className="clear-all-activities"
                      onClick={handleClearAllActivitiesRequest}
                    >
                      <FaTrashAlt aria-hidden="true" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
                <div className="activity-list">
                  {Object.keys(groupedActivities).length === 0 && (
                    <p className="empty-log">No activities logged yet.</p>
                  )}
                  {Object.entries(groupedActivities).map(([date, entries]) => (
                    <div key={date} className="activity-day">
                      <p className="activity-date">{date}</p>
                      {entries.map((entry, index) => (
                        <div key={`${entry.timestamp}-${index}`} className="activity-pill">
                        <div className="activity-label">
                          <div>{entry.label}</div>
                          {entry.note && (
                            <div className="activity-note">
                              {entry.note}
                            </div>
                          )}
                        </div>
                          <button
                            type="button"
                            className="activity-delete-icon"
                            onClick={() => handleDeleteActivityRequest(entry.timestamp, index)}
                            aria-label="Delete activity"
                          >
                            <FaTimes aria-hidden="true" />
                          </button>
                        </div>
                      ))}

                    </div>
                  ))}
                </div>
              </div>
            </section>
        </div>
      </div>

      {deleteConfirmation && (
        <div className="confirm-layer" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <p>{deleteConfirmation.message}</p>
            <div className="confirm-buttons">
              <button type="button" className="confirm-yes" onClick={handleConfirmDelete}>
                Yes, Delete
              </button>
              <button
                type="button"
                className="confirm-no"
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingAction && selectedChild && (
        <div className="confirm-layer" role="dialog" aria-modal="true">
          <div className="confirm-box activity-confirm-box">
            <p>{pendingAction.action.confirmation(selectedChild.name)}</p>
            
            <div className="time-selection-options">
              <button
                type="button"
                className={`time-option-button ${useCurrentTime ? 'active' : ''}`}
                onClick={() => setUseCurrentTime(true)}
              >
                Current Time
              </button>
              <button
                type="button"
                className={`time-option-button ${!useCurrentTime ? 'active' : ''}`}
                onClick={() => {
                  const now = new Date()
                  setSelectedHour(now.getHours())
                  setSelectedMinute(now.getMinutes())
                  setUseCurrentTime(false)
                }}
              >
                Select Time
              </button>
            </div>

            {!useCurrentTime && selectedHour !== null && selectedMinute !== null && (
              <div className="time-picker-container">
                <TimePicker
                  key={`${selectedHour}-${selectedMinute}`}
                  initialHour={selectedHour % 12 || 12}
                  initialMinute={selectedMinute}
                  initialPeriod={selectedHour >= 12 ? 'PM' : 'AM'}
                  onChange={handleTimeChange}
                />
              </div>
            )}

              <div className="note-input-container">
              <label className="note-label" htmlFor="activity-note">
                Add note (optional)
              </label>
              <textarea
                id="activity-note"
                className="note-textarea"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Drank only half bottle, seemed fussy..."
              />
            </div>

            <div className="confirm-buttons">
              <button type="button" className="confirm-yes" onClick={handleConfirmAction}>
                Record
              </button>
              <button type="button" className="confirm-no" onClick={() => setPendingAction(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationMessage && (
        <div className="confirmation-toast" role="status">
          {confirmationMessage}
        </div>
      )}
    </main>
  )
}

function ChildrenPage({
  onBack,
  onNavigateToChild,
  childLogs,
  setChildLogs,
  childrenProfiles,
  setChildrenProfiles,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [addChildForm, setAddChildForm] = useState({
    name: '',
    photoFile: null,
    photoPreview: null,
    parentLanguage: 'en',
    parentLanguageCustomName: '',
    parentPhone: '',
  })
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [presentChildren, setPresentChildren] = useState(new Set())
  const [bulkActionModal, setBulkActionModal] = useState(null) // { type: 'nap' | 'meal' }
  const [bulkActionTime, setBulkActionTime] = useState({ hour: null, minute: null })
  const [bulkActionUseCurrentTime, setBulkActionUseCurrentTime] = useState(true)
  const [bulkActionNote, setBulkActionNote] = useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!confirmationMessage) return
    const timeout = setTimeout(() => setConfirmationMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [confirmationMessage])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (addChildForm.photoPreview) {
        URL.revokeObjectURL(addChildForm.photoPreview)
      }
    }
  }, [])

  const visibleChildren = useMemo(() => {
    if (!searchTerm.trim()) return childrenProfiles
    return childrenProfiles.filter((child) =>
      child.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm, childrenProfiles])

  const handleTogglePresent = (childId, event) => {
    event.stopPropagation() // Prevent navigation when clicking checkbox
    setPresentChildren((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(childId)) {
        newSet.delete(childId)
      } else {
        newSet.add(childId)
      }
      return newSet
    })
  }

  const handleBulkActionClick = (actionType) => {
    if (presentChildren.size === 0) {
      setConfirmationMessage('Please select at least one child as present')
      return
    }
    const now = new Date()
    setBulkActionTime({ hour: now.getHours(), minute: now.getMinutes() })
    setBulkActionUseCurrentTime(true)
    setBulkActionNote('')
    setBulkActionModal({ type: actionType })
  }

  const handleBulkActionTimeChange = (hour24, minute) => {
    setBulkActionTime({ hour: hour24, minute })
  }

  const handleConfirmBulkAction = () => {
    if (!bulkActionModal || presentChildren.size === 0) return

    const action = actionOptions.find((a) => a.id === bulkActionModal.type)
    if (!action) return

    let selectedDate
    let timeDisplay

    if (bulkActionUseCurrentTime) {
      selectedDate = new Date()
      timeDisplay = selectedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else {
      selectedDate = new Date()
      selectedDate.setHours(bulkActionTime.hour, bulkActionTime.minute, 0, 0)
      const hour12 = bulkActionTime.hour % 12 || 12
      const period = bulkActionTime.hour >= 12 ? 'PM' : 'AM'
      timeDisplay = `${hour12}:${bulkActionTime.minute.toString().padStart(2, '0')} ${period}`
    }

    const presentChildrenArray = Array.from(presentChildren)
    const presentChildrenNames = presentChildrenArray
      .map((id) => childrenProfiles.find((c) => c.id === id)?.name)
      .filter(Boolean)

    // Log activity for all present children
    setChildLogs((prev) => {
      const updated = { ...prev }
      presentChildrenArray.forEach((childId) => {
        const logEntry = {
          timestamp: selectedDate.toISOString(),
          label: `${action.label} recorded at ${timeDisplay}`,
          note: bulkActionNote.trim() ? bulkActionNote.trim() : undefined,
        }
        updated[childId] = [logEntry, ...(updated[childId] ?? [])]
      })
      return updated
    })

    const namesList = presentChildrenNames.join(', ')
    setConfirmationMessage(`${action.label} recorded for: ${namesList}`)
    setBulkActionModal(null)
    setBulkActionNote('')
  }

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setConfirmationMessage('Please select a valid image file (JPG, PNG, WebP)')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setConfirmationMessage('Image must be smaller than 5MB')
      return
    }

    try {
      const previewUrl = URL.createObjectURL(file)
      setAddChildForm((prev) => ({
        ...prev,
        photoFile: file,
        photoPreview: previewUrl,
      }))
    } catch (error) {
      console.error('Photo upload error:', error)
      setConfirmationMessage('Failed to load photo. Please try again.')
    }
  }

  const handleAddChild = async () => {
    const name = addChildForm.name.trim()

    if (!name) {
      setConfirmationMessage('Please enter a name')
      return
    }

    if (name.length > 30) {
      setConfirmationMessage('Name must be 30 characters or less')
      return
    }

    if (
      addChildForm.parentLanguage === 'other' &&
      !addChildForm.parentLanguageCustomName.trim()
    ) {
      setConfirmationMessage('Please enter a language name')
      return
    }

    const cleanPhone = (addChildForm.parentPhone || '').replace(/\D/g, '')
    if (cleanPhone.length !== 10 && cleanPhone.length !== 0) {
      setConfirmationMessage('Please enter a valid 10-digit parent phone number')
      return
    }

    const formattedParentPhone =
      cleanPhone.length === 10
        ? `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
        : ''

    if (childrenProfiles.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setConfirmationMessage('A child with this name already exists')
      return
    }

    let photoUrl = '/default-avatar.svg'

    // If a photo was uploaded, convert it to base64 data URL for persistence
    if (addChildForm.photoFile) {
      try {
        const reader = new FileReader()
        photoUrl = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(addChildForm.photoFile)
        })
      } catch (error) {
        console.error('Error converting photo to data URL:', error)
        photoUrl = '/default-avatar.svg'
      }
    }

    const isOther = addChildForm.parentLanguage === 'other'
    const customName = addChildForm.parentLanguageCustomName?.trim() || ''

    const newChild = {
      id: generateChildId(),
      name,
      avatar: photoUrl,
      favoriteColor: getRandomColor(),
      activities: [],
      parentLanguage: isOther && customName ? 'other' : addChildForm.parentLanguage || 'en',
      parentLanguageCustomName: isOther ? customName : '',
      parentPhone: formattedParentPhone,
    }

    const updatedProfiles = [...childrenProfiles, newChild]
    setChildrenProfiles(updatedProfiles)
    setChildLogs((prev) => ({ ...prev, [newChild.id]: [] }))

    // Save CSV file (to server if available)
    setTimeout(async () => {
      await saveCSV(updatedProfiles)
    }, 500)

    if (addChildForm.photoPreview) {
      URL.revokeObjectURL(addChildForm.photoPreview)
    }

    setShowAddChildModal(false)
    setAddChildForm({
      name: '',
      photoFile: null,
      photoPreview: null,
      parentLanguage: 'en',
      parentLanguageCustomName: '',
      parentPhone: '',
    })
    setConfirmationMessage(`${name} has been added.`)
  }

  return (
    <main className="children-shell">
      <div className="children-card">
        <header className="children-header">
          <button type="button" className="back-link" onClick={onBack}>
            Back
          </button>
          <div className="children-header-title">
            <h1>Children</h1>
            <div className="search-field">
              <FaSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="children-content">
          <aside className="children-list">
            <button
              type="button"
              className="add-child-button"
              onClick={() => setShowAddChildModal(true)}
            >
              <FaPlus aria-hidden="true" />
              <span>Add Child</span>
            </button>

            <div className="bulk-actions-container">
              <button
                type="button"
                className="bulk-action-button"
                onClick={() => handleBulkActionClick('nap')}
                disabled={presentChildren.size === 0}
              >
                <FaMoon aria-hidden="true" />
                <span>Nap (All Present)</span>
              </button>
              <button
                type="button"
                className="bulk-action-button"
                onClick={() => handleBulkActionClick('meal')}
                disabled={presentChildren.size === 0}
              >
                <FaUtensils aria-hidden="true" />
                <span>Meal (All Present)</span>
              </button>
            </div>

            <div className="roll-call-header">
              <span className="roll-call-title">Roll Call</span>
              <span className="present-count">
                {presentChildren.size} present
              </span>
            </div>

            {visibleChildren.map((child) => {
              const isPresent = presentChildren.has(child.id)
              return (
                <div
                  key={child.id}
                  className={`child-card-wrapper ${isPresent ? 'present' : ''}`}
                >
                  <label className="present-checkbox">
                    <input
                      type="checkbox"
                      checked={isPresent}
                      onChange={(e) => handleTogglePresent(child.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="checkbox-label">Present</span>
                  </label>
                  <button
                    type="button"
                    className="child-card"
                    onClick={() => onNavigateToChild(child.id)}
                  >
                    <span className="child-avatar">
                      <img src={child.avatar} alt={`${child.name}'s avatar`} />
                    </span>
                    <span className="child-name">{child.name}</span>
                  </button>
                </div>
              )
            })}
          </aside>

          {childrenProfiles.length === 0 ? (
            <div className="empty-children-state">
              <FaBaby aria-hidden="true" />
              <p>No children yet</p>
              <p className="empty-hint">Click "Add Child" to get started</p>
            </div>
          ) : (
            <div className="empty-children-state">
              <FaChild aria-hidden="true" />
              <p>Select a child to view details</p>
              <p className="empty-hint">Click on a child from the list</p>
            </div>
          )}
        </div>
      </div>

      {showAddChildModal && (
        <div className="confirm-layer" role="dialog" aria-modal="true">
          <div className="add-child-modal">
            <h2>Add New Child</h2>

            <div
              className="photo-upload-area"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              {addChildForm.photoPreview ? (
                <img src={addChildForm.photoPreview} alt="Preview" />
              ) : (
                <>
                  <FaCamera aria-hidden="true" />
                  <p>Click to upload photo</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
              aria-label="Upload child photo"
            />

            <input
              type="text"
              className="add-child-input"
              placeholder="Child's name"
              value={addChildForm.name}
              onChange={(e) =>
                setAddChildForm((prev) => ({ ...prev, name: e.target.value }))
              }
              maxLength={30}
              aria-label="Child's name"
            />

            <input
              type="tel"
              className="add-child-input"
              placeholder="Parent phone (optional)"
              value={addChildForm.parentPhone}
              onChange={(e) =>
                setAddChildForm((prev) => ({ ...prev, parentPhone: e.target.value }))
              }
              aria-label="Parent phone"
            />

            <div className="add-child-language-block">
              <label
                className="add-child-language-label"
                htmlFor="parent-language-select"
              >
                Parent language
              </label>
              <select
                id="parent-language-select"
                className="language-select add-child-language-select"
                value={addChildForm.parentLanguage}
                onChange={(e) =>
                  setAddChildForm((prev) => ({
                    ...prev,
                    parentLanguage: e.target.value,
                    parentLanguageCustomName:
                      e.target.value === 'other' ? prev.parentLanguageCustomName : '',
                  }))
                }
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
                <option value="other">🌐 Other</option>
              </select>

              {addChildForm.parentLanguage === 'other' && (
                <input
                  type="text"
                  className="custom-language-input"
                  value={addChildForm.parentLanguageCustomName}
                  onChange={(e) =>
                    setAddChildForm((prev) => ({
                      ...prev,
                      parentLanguageCustomName: e.target.value,
                    }))
                  }
                  placeholder="Type any language (e.g., Urdu)"
                />
              )}
            </div>

            <div className="add-child-buttons">
              <button
                type="button"
                className="add-child-cancel"
                onClick={() => {
                  setShowAddChildModal(false)
                  setAddChildForm({
                    name: '',
                    photoFile: null,
                    photoPreview: null,
                    parentLanguage: 'en',
                    parentLanguageCustomName: '',
                    parentPhone: '',
                  })
                  if (addChildForm.photoPreview) {
                    URL.revokeObjectURL(addChildForm.photoPreview)
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="add-child-submit"
                onClick={handleAddChild}
                disabled={!addChildForm.name.trim()}
              >
                Add Child
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkActionModal && (
        <div className="confirm-layer" role="dialog" aria-modal="true">
          <div className="confirm-box activity-confirm-box">
            <p>
              Record {bulkActionModal.type === 'nap' ? 'nap' : 'meal'} for {presentChildren.size}{' '}
              {presentChildren.size === 1 ? 'child' : 'children'}?
            </p>

            <div className="time-selection-options">
              <button
                type="button"
                className={`time-option-button ${bulkActionUseCurrentTime ? 'active' : ''}`}
                onClick={() => setBulkActionUseCurrentTime(true)}
              >
                Current Time
              </button>
              <button
                type="button"
                className={`time-option-button ${!bulkActionUseCurrentTime ? 'active' : ''}`}
                onClick={() => {
                  const now = new Date()
                  setBulkActionTime({ hour: now.getHours(), minute: now.getMinutes() })
                  setBulkActionUseCurrentTime(false)
                }}
              >
                Select Time
              </button>
            </div>

            {!bulkActionUseCurrentTime && bulkActionTime.hour !== null && bulkActionTime.minute !== null && (
              <div className="time-picker-container">
                <TimePicker
                  key={`bulk-${bulkActionTime.hour}-${bulkActionTime.minute}`}
                  initialHour={bulkActionTime.hour % 12 || 12}
                  initialMinute={bulkActionTime.minute}
                  initialPeriod={bulkActionTime.hour >= 12 ? 'PM' : 'AM'}
                  onChange={handleBulkActionTimeChange}
                />
        </div>
      )}

            <div className="note-input-container">
              <label className="note-label" htmlFor="bulk-activity-note">
                Add note (optional)
              </label>
              <textarea
                id="bulk-activity-note"
                className="note-textarea"
                value={bulkActionNote}
                onChange={(e) => setBulkActionNote(e.target.value)}
                placeholder="Drank only half bottle, seemed fussy..."
              />
            </div>

            <div className="confirm-buttons">
              <button type="button" className="confirm-yes" onClick={handleConfirmBulkAction}>
                Record
              </button>
              <button
                type="button"
                className="confirm-no"
                onClick={() => {
                  setBulkActionModal(null)
                  setBulkActionNote('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationMessage && (
        <div className="confirmation-toast" role="status">
          {confirmationMessage}
        </div>
      )}
    </main>
  )
}


function ParentReportsPage({ onBack, childLogs, childrenProfiles }) {
  const [parentReports, setParentReports] = useState(() =>
    (childrenProfiles || []).map((child) => ({
      id: `report_${child.id}`,
      childId: child.id,
      childName: child.name,
      defaultLanguage: child.parentLanguage || 'en',
      customLanguageName:
        child.parentLanguage === 'other'
          ? child.parentLanguageCustomName || ''
          : '',
    })),
  )

  // Update reports when children profiles change
  useEffect(() => {
    setParentReports((prevReports) => {
      const newReports = (childrenProfiles || []).map((child) => {
        const existing = prevReports.find((r) => r.childId === child.id)
        return (
          existing || {
            id: `report_${child.id}`,
            childId: child.id,
            childName: child.name,
            defaultLanguage: child.parentLanguage || 'en',
            customLanguageName: child.parentLanguage === 'other' ? child.parentLanguageCustomName || '' : '',
          }
        )
      })
      return newReports
    })
  }, [childrenProfiles])

  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [showSMSPreview, setShowSMSPreview] = useState(null)
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (!confirmationMessage) return
    const timeout = setTimeout(() => setConfirmationMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [confirmationMessage])

  const handleLanguageChange = (reportId, newLanguage) => {
    setParentReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? {
              ...report,
              defaultLanguage: newLanguage,
              customLanguageName:
                newLanguage === 'other' ? report.customLanguageName || '' : '',
            }
          : report,
      ),
    )
  }

  const handleCustomLanguageChange = (reportId, value) => {
    setParentReports((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, customLanguageName: value } : report,
      ),
    )
  }

  const handleSendClick = async (report) => {
    const child = childrenProfiles.find((c) => c.id === report.childId)

    if (!child || !child.parentPhone) {
      setConfirmationMessage(
        'Please add a parent phone number for this child on the Children page first',
      )
      return
    }

    if (report.defaultLanguage === 'other' && !report.customLanguageName?.trim()) {
      setConfirmationMessage('Please enter a language for this parent first')
      return
    }

    const childActivities = childLogs[report.childId] || []
    const today = new Date().toISOString().split('T')[0]
    const todayActivities = childActivities.filter((act) =>
      act.timestamp.startsWith(today),
    )

    const targetLanguageForAI =
      report.defaultLanguage === 'other'
        ? report.customLanguageName.trim()
        : report.defaultLanguage

    setIsTranslating(true)
    const translatedMessage = await buildTranslatedParentReport(
      report.childName,
      todayActivities,
      targetLanguageForAI,
    )
    setIsTranslating(false)

    setShowSMSPreview({
      reportId: report.id,
      childName: report.childName,
      phone: child.parentPhone,
      language: targetLanguageForAI,
      customLanguageName:
        report.defaultLanguage === 'other'
          ? report.customLanguageName.trim()
          : null,
      translatedMessage,
    })
  }

  const handleSendSMS = (preview) => {
    const { phone, translatedMessage } = preview
    const cleanPhone = phone.replace(/\D/g, '')
    const encodedMessage = encodeURIComponent(translatedMessage)
    const smsLink = `sms:${cleanPhone}?body=${encodedMessage}`
    window.location.href = smsLink
    setShowSMSPreview(null)
    setConfirmationMessage('SMS app opened')
  }

  const handleCopySMS = async (translatedMessage) => {
    try {
      await navigator.clipboard.writeText(translatedMessage)
      setConfirmationMessage('Message copied to clipboard')
      setShowSMSPreview(null)
    } catch (err) {
      setConfirmationMessage('Failed to copy message')
    }
  }

  const getLanguageDisplayName = (codeOrName, customName) => {
    if (customName && customName.trim()) return customName.trim()
    const match = SUPPORTED_LANGUAGES.find((lang) => lang.code === codeOrName)
    return match ? match.name : codeOrName
  }

  return (
    <main className="parent-reports-shell">
      <div className="parent-reports-card">
        <header className="parent-reports-header">
          <button type="button" className="back-link" onClick={onBack}>
            Back
          </button>
          <h1>Parent Reports</h1>
        </header>

        <div className="parent-reports-content">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Default Language</th>
                <th>Send</th>
              </tr>
            </thead>
            <tbody>
              {parentReports.map((report) => (
                <tr key={report.id}>
                  <td className="child-name-cell">{report.childName}</td>
                  <td>
                    <div className="language-cell">
                    <select
                      className="language-select"
                      value={report.defaultLanguage}
                        onChange={(e) =>
                          handleLanguageChange(report.id, e.target.value)
                        }
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                        <option value="other">🌐 Other</option>
                    </select>

                      {report.defaultLanguage === 'other' && (
                      <input
                          type="text"
                          className="custom-language-input"
                          value={report.customLanguageName || ''}
                          onChange={(e) =>
                            handleCustomLanguageChange(report.id, e.target.value)
                          }
                          placeholder="Type any language (e.g., Urdu)"
                        />
                      )}
                      </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="send-report-button"
                      onClick={() => handleSendClick(report)}
                      disabled={isTranslating}
                    >
                      <FaPaperPlane aria-hidden="true" />
                      <span>{isTranslating ? 'Translating…' : 'Send'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSMSPreview && (
        <div className="confirm-layer" role="dialog" aria-modal="true">
          <div className="sms-preview-modal">
            <h2>Preview Message</h2>

            <div className="sms-preview-header">
              <span>To: {showSMSPreview.phone}</span>
              <span>
                <FaGlobe />{' '}
                {getLanguageDisplayName(
                  showSMSPreview.language,
                  showSMSPreview.customLanguageName,
                )}
              </span>
            </div>

            <div className="sms-preview-content">
              {showSMSPreview.translatedMessage}
            </div>

            <div className="character-count">
              {showSMSPreview.translatedMessage.length} characters
            </div>

            <div className="sms-preview-buttons">
              <button type="button" onClick={() => setShowSMSPreview(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopySMS(showSMSPreview.translatedMessage)
                }
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                onClick={() => handleSendSMS(showSMSPreview)}
              >
                <FaPaperPlane aria-hidden="true" /> Open SMS App
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationMessage && (
        <div className="confirmation-toast" role="status">
          {confirmationMessage}
        </div>
      )}
    </main>
  )
}



function UserProfilePage({ onBack }) {
  const [profile, setProfile] = useState(defaultBabysitterProfile)
  const [editingField, setEditingField] = useState(null)
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')

  useEffect(() => {
    if (!confirmationMessage) return
    const timeout = setTimeout(() => setConfirmationMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [confirmationMessage])

  const handleEditEmail = () => {
    setEditingField('email')
    setEmailInput(profile.email)
  }

  const handleEditPhone = () => {
    setEditingField('phone')
    setPhoneInput(profile.phone)
  }

  const handleSaveEmail = () => {
    const trimmedEmail = emailInput.trim()

    if (!trimmedEmail) {
      setConfirmationMessage('Email cannot be empty')
      setEditingField(null)
      setEmailInput('')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setConfirmationMessage('Please enter a valid email address')
      setEditingField(null)
      setEmailInput('')
      return
    }

    setProfile((prev) => ({ ...prev, email: trimmedEmail }))
    setEditingField(null)
    setEmailInput('')
    setConfirmationMessage('Email updated successfully')
  }

  const handleSavePhone = () => {
    const cleanPhone = phoneInput.replace(/\D/g, '')

    if (cleanPhone.length !== 10 && cleanPhone.length !== 0) {
      setConfirmationMessage('Please enter a valid 10-digit phone number')
      setEditingField(null)
      setPhoneInput('')
      return
    }

    const formattedPhone =
      cleanPhone.length === 10
        ? `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
        : ''

    setProfile((prev) => ({ ...prev, phone: formattedPhone }))
    setEditingField(null)
    setPhoneInput('')
    setConfirmationMessage('Phone number updated successfully')
  }

  return (
    <main className="user-profile-shell">
      <div className="user-profile-card">
        <header className="user-profile-header">
          <button type="button" className="back-link" onClick={onBack}>
            Back
          </button>
          <h1>User Profile</h1>
        </header>

        <div className="user-profile-content">
          <div className="user-profile-hero">
            <div className="user-profile-photo">
              <img src={profile.photo} alt="Profile" />
            </div>
            <h2 className="user-profile-name">{profile.name}</h2>
          </div>

          <div className="user-info-card">
            <div className="user-info-label">
              <FaEnvelope aria-hidden="true" />
              <span>Email</span>
            </div>
            {editingField === 'email' ? (
              <input
                type="email"
                className="user-info-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onBlur={handleSaveEmail}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEmail()
                  if (e.key === 'Escape') {
                    setEditingField(null)
                    setEmailInput('')
                  }
                }}
                placeholder="email@example.com"
                autoFocus
              />
            ) : (
              <div className="user-info-value-editable" onClick={handleEditEmail}>
                <span>{profile.email}</span>
                <FaEdit className="edit-icon" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="user-info-card">
            <div className="user-info-label">
              <FaPhone aria-hidden="true" />
              <span>Phone</span>
            </div>
            {editingField === 'phone' ? (
              <input
                type="tel"
                className="user-info-input"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onBlur={handleSavePhone}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePhone()
                  if (e.key === 'Escape') {
                    setEditingField(null)
                    setPhoneInput('')
                  }
                }}
                placeholder="(555) 123-4567"
                autoFocus
              />
            ) : (
              <div className="user-info-value-editable" onClick={handleEditPhone}>
                <span>{profile.phone}</span>
                <FaEdit className="edit-icon" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmationMessage && (
        <div className="confirmation-toast" role="status">
          {confirmationMessage}
        </div>
      )}
    </main>
  )
}

function App() {
  const [page, setPage] = useState('home')
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [childrenProfiles, setChildrenProfiles] = useState([])
  const [childLogs, setChildLogs] = useState({})
  const [loading, setLoading] = useState(true)

  // Load children from CSV and localStorage on mount
  useEffect(() => {
    const loadChildren = async () => {
      setLoading(true)
      try {
        const profiles = await loadAllChildren()
          setChildrenProfiles(profiles)
          const storedLogs = loadChildLogsFromLocalStorage()
          if (storedLogs) {
            setChildLogs(storedLogs)
          } else {
            const logs = Object.fromEntries(
              profiles.map((child) => [child.id, child.activities || []]),
            )
            setChildLogs(logs)
          }
      } catch (error) {
        console.error('Failed to load children:', error)
        // Fallback to empty arrays
        setChildrenProfiles([])
        setChildLogs({})
      } finally {
        setLoading(false)
      }
    }
    loadChildren()
  }, [])

  // Note: Children profiles are saved to CSV only, not localStorage

  useEffect(() => {
    if (!loading) {
      saveChildLogsToLocalStorage(childLogs)
    }
  }, [childLogs, loading])

  if (page === 'children') {
    return (
      <ChildrenPage
        onBack={() => setPage('home')}
        onNavigateToChild={(childId) => {
          setSelectedChildId(childId)
          setPage('child-detail')
        }}
        childLogs={childLogs}
        setChildLogs={setChildLogs}
        childrenProfiles={childrenProfiles}
        setChildrenProfiles={setChildrenProfiles}
      />
    )
  }
  if (page === 'child-detail') {
    return (
      <ChildDetailPage
        childId={selectedChildId}
        onBack={() => setPage('children')}
        childLogs={childLogs}
        setChildLogs={setChildLogs}
        childrenProfiles={childrenProfiles}
        setChildrenProfiles={setChildrenProfiles}
      />
    )
  }
  if (page === 'alert') {
    return (
      <AlertPage
        onBack={() => setPage('home')}
        childrenProfiles={childrenProfiles}
      />
    )
  }
  if (page === 'reports') {
    return <ParentReportsPage onBack={() => setPage('home')} childLogs={childLogs} childrenProfiles={childrenProfiles} />
  }
  if (page === 'user') {
    return <UserProfilePage onBack={() => setPage('home')} />
  }

  // Show loading state while children are being loaded
  if (loading) {
    return (
      <main className="home-shell">
        <div className="home-card">
          <header className="home-header">
            <p className="eyebrow">Babysitter Companion</p>
            <h1>Loading...</h1>
            <p className="subtitle">Loading children data...</p>
          </header>
        </div>
      </main>
    )
  }

  return <HomePage onNavigate={setPage} />
}

export default App
