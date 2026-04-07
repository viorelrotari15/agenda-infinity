import { getLocale, type AppLocale } from './locale-context';

type MessageTable = Record<string, string>;

const en: MessageTable = {
  admin_access_required: 'Admin access required',
  email_already_exists: 'Email already exists',
  displayname_slug_required_specialist: 'displayName and slug required for specialist',
  slug_taken: 'Slug already taken',
  specialist_not_found: 'Specialist not found',
  invalid_time_range: 'Invalid time range',
  block_not_found: 'Block not found',
  service_type_not_found: 'Service type not found',
  phone_min_8: 'Phone number must be at least 8 characters',
  invalid_credentials: 'Invalid credentials',
  missing_bearer_token: 'Missing bearer token',
  invalid_token: 'Invalid or expired token',
  user_not_found: 'User not found',
  missing_date: 'Missing date parameter',
  invalid_date: 'Invalid date: {{value}}',
  phone_must_8: 'Phone must be at least 8 characters',
  public_bio_too_long: 'Public bio must be at most 8000 characters',
  seo_title_too_long: 'SEO title must be at most 200 characters',
  service_not_found: 'Service not found',
  slot_occupied: 'Selected time slot is already occupied',
  no_recurrence_occurrences: 'No recurrence occurrences generated',
  recurrence_slots_occupied: 'One or more recurrence slots are already occupied',
  specialist_role_required: 'Specialist role required',
  specialist_profile_not_found: 'Specialist profile not found',
  booking_not_found: 'Booking not found',
  decision_invalid: 'decision must be accept or deny',
  booking_decision_pending_only: 'Only bookings awaiting your decision can be updated',
  client_role_required: 'Client role required',
  notify_decision_accept_title: 'Booking accepted',
  notify_decision_deny_title: 'Booking not confirmed',
  notify_decision_accept_body:
    'Hi {{clientName}}, {{specialistName}} accepted your {{serviceName}} on {{startLabel}}. See you then.',
  notify_decision_deny_body:
    'Hi {{clientName}}, {{specialistName}} could not confirm your {{serviceName}} ({{startLabel}}). Please book another time if you still need an appointment.',
  review_self_specialist: 'You cannot review your own specialist profile',
  review_rating_invalid: 'Rating must be an integer from 1 to 5',
  review_comment_short: 'Comment must be at least 3 characters',
  review_comment_long: 'Comment must be at most 2000 characters',
  review_already_exists: 'You already submitted a review for this specialist',
  interests_too_many: 'Too many categories selected',
  category_invalid: 'One or more categories are invalid',
  category_slug_taken: 'Category slug already exists',
  review_not_found: 'Review not found',
  storage_not_configured: 'File storage is not configured',
  media_purpose_invalid: 'purpose must be avatar or gallery',
  media_file_missing: 'Image file is required',
  image_invalid: 'Could not read image; use JPEG, PNG, or WebP',
  gallery_limit: 'Gallery image limit reached',
  media_not_found: 'Media not found',
};

const ro: MessageTable = {
  admin_access_required: 'Este necesar acces de administrator',
  email_already_exists: 'Adresa de e-mail există deja',
  displayname_slug_required_specialist: 'displayName și slug sunt obligatorii pentru specialist',
  slug_taken: 'Slug-ul este deja folosit',
  specialist_not_found: 'Specialist negăsit',
  invalid_time_range: 'Interval de timp invalid',
  block_not_found: 'Bloc negăsit',
  service_type_not_found: 'Tip de serviciu negăsit',
  phone_min_8: 'Numărul de telefon trebuie să aibă cel puțin 8 caractere',
  invalid_credentials: 'Date de autentificare incorecte',
  missing_bearer_token: 'Lipsește token-ul bearer',
  invalid_token: 'Token invalid sau expirat',
  user_not_found: 'Utilizator negăsit',
  missing_date: 'Lipsește parametrul dată',
  invalid_date: 'Dată invalidă: {{value}}',
  phone_must_8: 'Telefonul trebuie să aibă cel puțin 8 caractere',
  public_bio_too_long: 'Descrierea publică trebuie să aibă cel mult 8000 de caractere',
  seo_title_too_long: 'Titlul SEO trebuie să aibă cel mult 200 de caractere',
  service_not_found: 'Serviciu negăsit',
  slot_occupied: 'Intervalul selectat este deja ocupat',
  no_recurrence_occurrences: 'Nu s-au generat repetări',
  recurrence_slots_occupied: 'Unul sau mai multe intervale de repetare sunt deja ocupate',
  specialist_role_required: 'Este necesar rolul de specialist',
  specialist_profile_not_found: 'Profilul de specialist nu a fost găsit',
  booking_not_found: 'Rezervare negăsită',
  decision_invalid: 'decizia trebuie să fie accept sau deny',
  booking_decision_pending_only:
    'Se pot actualiza doar rezervările care așteaptă decizia dumneavoastră',
  client_role_required: 'Este necesar rolul de client',
  notify_decision_accept_title: 'Rezervare acceptată',
  notify_decision_deny_title: 'Rezervare neconfirmată',
  notify_decision_accept_body:
    'Bună, {{clientName}}, {{specialistName}} a acceptat {{serviceName}} pe {{startLabel}}. Ne vedem atunci.',
  notify_decision_deny_body:
    'Bună, {{clientName}}, {{specialistName}} nu a putut confirma {{serviceName}} ({{startLabel}}). Rezervați alt moment dacă mai aveți nevoie.',
  review_self_specialist: 'Nu vă puteți evalua propriul profil de specialist',
  review_rating_invalid: 'Evaluarea trebuie să fie un număr întreg între 1 și 5',
  review_comment_short: 'Comentariul trebuie să aibă cel puțin 3 caractere',
  review_comment_long: 'Comentariul trebuie să aibă cel mult 2000 de caractere',
  review_already_exists: 'Ați trimis deja o evaluare pentru acest specialist',
  interests_too_many: 'Prea multe categorii selectate',
  category_invalid: 'Una sau mai multe categorii sunt invalide',
  category_slug_taken: 'Slug-ul categoriei există deja',
  review_not_found: 'Recenzie negăsită',
  storage_not_configured: 'Stocarea fișierelor nu este configurată',
  media_purpose_invalid: 'purpose trebuie să fie avatar sau gallery',
  media_file_missing: 'Este necesar un fișier imagine',
  image_invalid: 'Imaginea nu a putut fi citită; folosiți JPEG, PNG sau WebP',
  gallery_limit: 'Limita de imagini în galerie a fost atinsă',
  media_not_found: 'Fișier media negăsit',
};

const ru: MessageTable = {
  admin_access_required: 'Требуются права администратора',
  email_already_exists: 'Такой email уже зарегистрирован',
  displayname_slug_required_specialist: 'Для специалиста нужны displayName и slug',
  slug_taken: 'Slug уже занят',
  specialist_not_found: 'Специалист не найден',
  invalid_time_range: 'Неверный диапазон времени',
  block_not_found: 'Блок не найден',
  service_type_not_found: 'Тип услуги не найден',
  phone_min_8: 'Телефон должен содержать не менее 8 символов',
  invalid_credentials: 'Неверный email или пароль',
  missing_bearer_token: 'Отсутствует bearer-токен',
  invalid_token: 'Недействительный или просроченный токен',
  user_not_found: 'Пользователь не найден',
  missing_date: 'Отсутствует параметр даты',
  invalid_date: 'Неверная дата: {{value}}',
  phone_must_8: 'Телефон должен содержать не менее 8 символов',
  public_bio_too_long: 'Публичное описание — не более 8000 символов',
  seo_title_too_long: 'SEO-заголовок — не более 200 символов',
  service_not_found: 'Услуга не найдена',
  slot_occupied: 'Выбранное время уже занято',
  no_recurrence_occurrences: 'Не сгенерировано ни одного повторения',
  recurrence_slots_occupied: 'Один или несколько слотов повторения уже заняты',
  specialist_role_required: 'Требуется роль специалиста',
  specialist_profile_not_found: 'Профиль специалиста не найден',
  booking_not_found: 'Запись не найдена',
  decision_invalid: 'decision должен быть accept или deny',
  booking_decision_pending_only: 'Можно обновить только записи, ожидающие вашего решения',
  client_role_required: 'Требуется роль клиента',
  notify_decision_accept_title: 'Запись подтверждена',
  notify_decision_deny_title: 'Запись не подтверждена',
  notify_decision_accept_body:
    'Здравствуйте, {{clientName}}, {{specialistName}} принял(а) вашу запись на {{serviceName}} на {{startLabel}}. До встречи.',
  notify_decision_deny_body:
    'Здравствуйте, {{clientName}}, {{specialistName}} не смог(ла) подтвердить {{serviceName}} ({{startLabel}}). Запишитесь на другое время, если услуга ещё нужна.',
  review_self_specialist: 'Нельзя оставить отзыв на свой профиль специалиста',
  review_rating_invalid: 'Оценка должна быть целым числом от 1 до 5',
  review_comment_short: 'Комментарий должен содержать не менее 3 символов',
  review_comment_long: 'Комментарий должен содержать не более 2000 символов',
  review_already_exists: 'Вы уже оставили отзыв об этом специалисте',
  interests_too_many: 'Выбрано слишком много категорий',
  category_invalid: 'Одна или несколько категорий недействительны',
  category_slug_taken: 'Такой slug категории уже существует',
  review_not_found: 'Отзыв не найден',
  storage_not_configured: 'Хранилище файлов не настроено',
  media_purpose_invalid: 'purpose должен быть avatar или gallery',
  media_file_missing: 'Требуется файл изображения',
  image_invalid: 'Не удалось прочитать изображение; используйте JPEG, PNG или WebP',
  gallery_limit: 'Достигнут лимит изображений в галерее',
  media_not_found: 'Медиафайл не найден',
};

const tables: Record<AppLocale, MessageTable> = { en, ro, ru };

function translate(lang: AppLocale, key: keyof typeof en, vars?: Record<string, string>): string {
  let s = tables[lang]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{{${k}}}`, v);
    }
  }
  return s;
}

export function apiTLocale(
  lang: AppLocale,
  key: keyof typeof en,
  vars?: Record<string, string>,
): string {
  return translate(lang, key, vars);
}

export function apiT(key: keyof typeof en, vars?: Record<string, string>): string {
  return translate(getLocale(), key, vars);
}
