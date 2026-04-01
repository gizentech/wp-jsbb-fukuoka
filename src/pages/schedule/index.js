import { useState, useEffect } from 'react'
import Head from 'next/head'
import Meta from '../../components/Meta/Meta.js'
import { FaChevronDown } from 'react-icons/fa'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/Schedule.module.css'
import { fetchCalendarEvents } from '../../lib/wp-api-client'

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

function processEvents(rawEvents) {
  const flatEvents = []
  for (const event of rawEvents) {
    const startDate = event.start?.date
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
        dateTime: event.start?.dateTime || null,
        date: event.start?.date || null,
      },
      end: {
        dateTime: event.end?.dateTime || null,
        date: event.end?.date || null,
      },
    })
  }

  return flatEvents.map((ev, i) => {
    const dateKey = ev.start.date || (ev.start.dateTime ? ev.start.dateTime.split('T')[0] : '')
    const prevDateKey = i > 0
      ? (flatEvents[i - 1].start.date || (flatEvents[i - 1].start.dateTime ? flatEvents[i - 1].start.dateTime.split('T')[0] : ''))
      : null
    return { ...ev, showDate: dateKey !== prevDateKey }
  })
}

export default function Schedule() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    fetchCalendarEvents()
      .then((rawEvents) => {
        setEvents(processEvents(rawEvents || []))
      })
      .catch(() => {
        setError('イベントの取得に失敗しました')
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleAccordion = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <>
      <Meta title="スケジュール・大会日程" description="福岡県軟式野球連盟の大会日程・スケジュール。今後3ヶ月間の軟式野球大会・審判講習会の予定をご確認いただけます。" keywords="福岡県軟式野球連盟,大会日程,スケジュール,野球大会日程,野球スケジュール,福岡野球大会日程,福岡県野球大会,軟式野球,硬式野球,学童野球大会日程,少年野球大会日程,高校野球日程,社会人野球日程,審判講習会,野球大会,杯,旗,福岡県大会日程,九州大会日程,大会カレンダー,試合日程,野球イベント" urlPath="/schedule" breadcrumbs={[{ name: 'スケジュール', path: '/schedule' }]} />
      <Head>
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
              {loading && <p className={styles.empty}>読み込み中...</p>}
              {error && <p className={styles.error}>{error}</p>}

              {!loading && !error && events.length === 0 && (
                <p className={styles.empty}>現在予定されている大会はありません</p>
              )}

              {!loading && !error && events.length > 0 && (
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
