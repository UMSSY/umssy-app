export const ATTACHMENT_METADATA_SELECT = {
  select: {
    id: true,
    messageId: true,
    typeId: true,
    fileName: true,
    mimeType: true,
    fileSize: true,
    url: true,
    thumbnailUrl: true,
    createdAt: true,
    type: {
      select: { title: true },
    },
  },
} as const;

export const MESSAGE_RELATIONS = {
  status: { select: { title: true } },
  attachments: ATTACHMENT_METADATA_SELECT,
} as const;
