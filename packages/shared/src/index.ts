import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN', 'SPECIALIST', 'CLIENT']);
export type Role = z.infer<typeof RoleSchema>;

export const BookingStatusSchema = z.enum(['CREATED', 'ACCEPTED', 'DENIED', 'CANCELLED']);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const ServiceDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
  bufferMinutes: z.number(),
  active: z.boolean(),
  serviceTypeId: z.string().nullable().optional(),
});
export type ServiceDto = z.infer<typeof ServiceDtoSchema>;

export const SpecialistPublicSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  timezone: z.string(),
  publicBio: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
});
export type SpecialistPublic = z.infer<typeof SpecialistPublicSchema>;

export const SlotSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});
export type Slot = z.infer<typeof SlotSchema>;

export const CreateBookingSchema = z.object({
  specialistId: z.string(),
  serviceId: z.string(),
  startUtc: z.string().datetime(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  recurrence: z
    .object({
      rrule: z.string(),
      untilUtc: z.string().datetime().optional(),
    })
    .optional(),
});
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const BookingEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  status: BookingStatusSchema,
  serviceName: z.string(),
  clientName: z.string(),
  clientEmail: z.string(),
  clientPhone: z.string().nullable().optional(),
  recurrenceSeriesId: z.string().nullable().optional(),
});
export type BookingEvent = z.infer<typeof BookingEventSchema>;

/** Specialist booking detail (extends list fields with ids and contact). */
export const SpecialistBookingDetailSchema = BookingEventSchema.extend({
  serviceId: z.string(),
  durationMinutes: z.number(),
});
export type SpecialistBookingDetail = z.infer<typeof SpecialistBookingDetailSchema>;

/** Client view of a booking (no other party’s contact fields). */
export const ClientBookingDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  status: BookingStatusSchema,
  serviceName: z.string(),
  specialistName: z.string(),
  specialistSlug: z.string(),
  durationMinutes: z.number(),
  recurrenceSeriesId: z.string().nullable().optional(),
});
export type ClientBookingDetail = z.infer<typeof ClientBookingDetailSchema>;

export const WorkingHoursRuleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startLocal: z.string(),
  endLocal: z.string(),
});
export type WorkingHoursRule = z.infer<typeof WorkingHoursRuleSchema>;

export const BannerPublicSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  sortOrder: z.number(),
});
export type BannerPublic = z.infer<typeof BannerPublicSchema>;

export const SpecialistCategoryBadgeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  isPrimary: z.boolean(),
});
export type SpecialistCategoryBadge = z.infer<typeof SpecialistCategoryBadgeSchema>;

export const SpecialistGalleryImageMeSchema = z.object({
  id: z.string(),
  publicUrl: z.string(),
  sortOrder: z.number(),
});
export type SpecialistGalleryImageMe = z.infer<typeof SpecialistGalleryImageMeSchema>;

export const SpecialistProfileMeSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  slug: z.string(),
  timezone: z.string(),
  publicBio: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  publicPhotoUrl: z.string().nullable().optional(),
  galleryImages: z.array(SpecialistGalleryImageMeSchema).optional(),
  categories: z.array(SpecialistCategoryBadgeSchema).optional(),
});
export type SpecialistProfileMe = z.infer<typeof SpecialistProfileMeSchema>;

export const MeUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  role: RoleSchema,
  specialistProfile: SpecialistProfileMeSchema.nullable().optional(),
  interestCategoryIds: z.array(z.string()).optional(),
});
export type MeUser = z.infer<typeof MeUserSchema>;

export const CategoryPublicSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  specialistCount: z.number(),
});
export type CategoryPublic = z.infer<typeof CategoryPublicSchema>;

export const DirectoryCategoryOnSpecialistSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  isPrimary: z.boolean(),
});
export type DirectoryCategoryOnSpecialist = z.infer<typeof DirectoryCategoryOnSpecialistSchema>;

export const DirectorySampleServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
});
export type DirectorySampleService = z.infer<typeof DirectorySampleServiceSchema>;

export const SpecialistDirectoryEntrySchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  timezone: z.string(),
  publicPhotoUrl: z.string().nullable(),
  publicBio: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  averageRating: z.number(),
  reviewCount: z.number(),
  categories: z.array(DirectoryCategoryOnSpecialistSchema),
  sampleServices: z.array(DirectorySampleServiceSchema),
});
export type SpecialistDirectoryEntry = z.infer<typeof SpecialistDirectoryEntrySchema>;

export const ReviewListItemSchema = z.object({
  id: z.string(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string(),
  authorLabel: z.string(),
});
export type ReviewListItem = z.infer<typeof ReviewListItemSchema>;

export const ReviewListResponseSchema = z.object({
  items: z.array(ReviewListItemSchema),
  nextCursor: z.string().nullable(),
});
export type ReviewListResponse = z.infer<typeof ReviewListResponseSchema>;
