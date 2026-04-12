import { google } from 'googleapis'

export async function getCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<{ start: string; end: string; summary: string }[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const calendar = google.calendar({ version: 'v3', auth })

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20,
  })

  return (res.data.items ?? [])
    .filter(e => e.start?.dateTime || e.start?.date)
    .map(e => ({
      summary: e.summary ?? 'Busy',
      start: e.start?.dateTime ?? `${e.start?.date}T00:00:00`,
      end: e.end?.dateTime ?? `${e.end?.date}T23:59:00`,
    }))
}

export async function addCalendarEvent(
  accessToken: string,
  title: string,
  description: string,
  startTime: Date,
  durationMinutes: number,
) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const calendar = google.calendar({ version: 'v3', auth })

  const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      description,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 5 }] },
    },
  })

  return { id: event.data.id, htmlLink: event.data.htmlLink }
}
