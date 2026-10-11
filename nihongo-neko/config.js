// Cấu hình chung của app. Bạn có thể chỉnh các con số ở đây cho hợp ý.
module.exports = {
  PORT: Number(process.env.PORT) || 3000,

  // ---- Tim (mạng) ----
  MAX_HEARTS: 5,
  HEART_REGEN_MINUTES: 20, // cứ 20 phút hồi 1 tim

  // ---- Xu ----
  COINS_PER_LESSON: 10,
  COINS_PER_BONUS_LESSON: 25, // bài ẩn / bài mua: lần đầu hoàn thành thưởng nhiều hơn     // xu cố định khi hoàn thành 1 bài
  COMBO_BONUS_EVERY: 3,     // cứ 3 câu đúng liên tiếp...
  COMBO_BONUS_COINS: 1,     // ...thưởng thêm 1 xu (cộng dồn theo chuỗi)
  COMBO_BONUS_CAP: 10,      // tối đa xu thưởng từ chuỗi đúng trong 1 bài
  START_COINS: 50,          // xu tặng khi tạo tài khoản

  // ---- XP ----
  XP_PER_LESSON: 15,
  XP_PER_CORRECT: 1,

  // ---- Chuỗi ngày học ----
  STREAK_FREEZE_MAX: 2,

  // ---- Bài học ----
  EXERCISES_PER_LESSON: 10,
  PASS_MIN_PERCENT: 0, // hết tim mới trượt, còn tim thì luôn qua bài
  REPLAY_COIN_PERCENT: 50, // học lại bài đã xong chỉ nhận 50% xu (tránh cày xu vô hạn)
  PRACTICE_XP: 8,          // ôn tập lỗi sai: có XP nhưng không có xu

  SESSION_DAYS: 30
};
