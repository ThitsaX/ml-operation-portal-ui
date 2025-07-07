export interface IGetAllAnnouncement {
  announcement_info_list: AnnouncementInfo[]
}

export interface AnnouncementInfo {
  id: string
  title: string
  detail: string | null
  date: string
}
