export interface IGetAllAnnouncement {
  announcementInfoList: AnnouncementInfo[]
}

export interface AnnouncementInfo {
  id: string
  title: string
  detail: string | null
  date: string
}
