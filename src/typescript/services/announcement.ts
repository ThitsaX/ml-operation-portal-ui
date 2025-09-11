export interface IGetAllAnnouncement {
  announcementInfoList: AnnouncementInfo[]
}

export interface AnnouncementInfo {
  id: string
  title: string
  detail: string | null
  date: string
}

export interface IGreetingMessage {
  greetingId: string
  greetingTitle: string
  greetingDetail: string
  createdDate: number
}
