import { google } from 'googleapis'

export interface CalendarEvent {
  title: string
  description?: string
  startTime: string // ISO string
  duration: number  // minutes
  colorId?: string
}

export async function addStudyEvent(accessToken: string, event: CalendarEvent) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth })

  const startDate = new Date(event.startTime)
  const endDate = new Date(startDate.getTime() + event.duration * 60 * 1000)

  const calEvent = {
    summary: event.title,
    description: event.description || 'Added by StudySpace AI',
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: event.colorId || '9', // Blueberry
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 5 },
      ],
    },
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: calEvent,
  })

  return response.data
}
