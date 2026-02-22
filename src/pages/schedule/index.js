import { useState } from 'react'
import Head from 'next/head'
import { FaChevronDown } from 'react-icons/fa'
import { google } from 'googleapis'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/Schedule.module.css'

const CALENDAR_ID = '7a96188de1254966ec76720552e75c9b03a75c5bb8f5da84ef1529a6b44f2497@group.calendar.google.com'
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    weekday: WEEKDAYS[d.getDay()],
  }
}

function formatTime(start, end) {
  if (start.date) return null
  const s = new Date(start.dateTime)
  const e = end?.dateTime ? new Date(end.dateTime) : null
  const sTime = `${s.getHours()}:${String(s.getMinutes()).padStart(2, '0')}`
  if (!e) return sTime
  const eTime = `${e.getHours()}:${String(e.getMinutes()).padStart(2, '0')}`
  return `${sTime} - ${eTime}`
}

export async function getServerSideProps() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    })

    const calendar = google.calendar({ version: 'v3', auth })

    const now = new Date()
    const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())

    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: threeMonthsLater.toISOString(),
      orderBy: 'startTime',
      singleEvents: true,
      maxResults: 100,
    })

    const flatEvents = []
    for (const event of res.data.items || []) {
      const startDate = event.start.date
      const endDate = event.end?.date

      if (startDate && endDate) {
        const s = new Date(startDate)
        const e = new Date(endDate)
        const days = Math.round((e - s) / (1000 * 60 * 60 * 24))

        if (days > 1) {
          for (let i = 0; i < days; i++) {
            const d = new Date(s)
            d.setDate(d.getDate() + i)
            const dateStr = d.toISOString().split('T')[0]
            flatEvents.push({
              id: `${event.id}_day${i}`,
              summary: event.summary || '',
              location: event.location || null,
              description: event.description || null,
              start: { dateTime: null, date: dateStr },
              end: { dateTime: null, date: dateStr },
            })
          }
          continue
        }
      }

      flatEvents.push({
        id: event.id,
        summary: event.summary || '',
        location: event.location || null,
        description: event.description || null,
        start: {
          dateTime: event.start.dateTime || null,
          date: event.start.date || null,
        },
        end: {
          dateTime: event.end?.dateTime || null,
          date: event.end?.date || null,
        },
      })
    }

    const events = flatEvents.map((ev, i) => {
      const dateKey = ev.start.date || (ev.start.dateTime ? ev.start.dateTime.split('T')[0] : '')
      const prevDateKey = i > 0
        ? (flatEvents[i - 1].start.date || (flatEvents[i - 1].start.dateTime ? flatEvents[i - 1].start.dateTime.split('T')[0] : ''))
        : null
      return { ...ev, showDate: dateKey !== prevDateKey }
    })

    return { props: { events } }
  } catch {
    return { props: { events: [], error: 'イベントの取得に失敗しました' } }
  }
}

export default function Schedule({ events, error }) {
  const [openId, setOpenId] = useState(null)

  const toggleAccordion = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <>
      <Head>
        <title>スケジュール | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="福岡県軟式野球連盟のスケジュール。今後3ヶ月間の予定をご確認いただけます。" />
        <link rel="preload" href="/images/tournament-bg.webp" as="image" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          {/* タイトルカード */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.pageName}>スケジュール</h1>
            </div>
          </div>

          <div className={styles.content}>
            <section id="schedule" className={styles.section}>
              {error && <p className={styles.error}>{error}</p>}

              {!error && events.length === 0 && (
                <p className={styles.empty}>現在予定されている大会はありません</p>
              )}

              {!error && events.length > 0 && (
                <ul className={styles.eventList}>
                  {events.map((event) => {
                    const dateStr = event.start.dateTime || event.start.date
                    const dateInfo = formatDate(dateStr)
                    const timeStr = formatTime(event.start, event.end)
                    const isOpen = openId === event.id
                    const hasDetail = event.location || event.description

                    return (
                      <li key={event.id} className={styles.eventItem}>
                        <button
                          type="button"
                          className={styles.eventHeader}
                          onClick={() => hasDetail && toggleAccordion(event.id)}
                          style={{ cursor: hasDetail ? 'pointer' : 'default' }}
                        >
                          <div className={`${styles.eventDate} ${!event.showDate ? styles.eventDateHidden : ''}`}>
                            <span className={styles.eventDateMonth}>{dateInfo.year}/{dateInfo.month}</span>
                            <span className={styles.eventDateDay}>{dateInfo.day}</span>
                            <span className={styles.eventDateWeekday}>{dateInfo.weekday}</span>
                          </div>
                          <div className={styles.eventInfo}>
                            <p className={styles.eventName}>{event.summary}</p>
                            {timeStr && <p className={styles.eventTime}>{timeStr}</p>}
                          </div>
                          {hasDetail && (
                            <FaChevronDown
                              className={`${styles.eventChevron} ${isOpen ? styles.eventChevronOpen : ''}`}
                            />
                          )}
                        </button>
                        {hasDetail && (
                          <div className={`${styles.eventDetail} ${isOpen ? styles.eventDetailOpen : ''}`}>
                            <div className={styles.eventDetailInner}>
                              {event.location && (
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>場所</span>
                                  <span className={styles.detailValue}>{event.location}</span>
                                </div>
                              )}
                              {event.description && (
                                <p className={styles.eventDescription}>{event.description}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
