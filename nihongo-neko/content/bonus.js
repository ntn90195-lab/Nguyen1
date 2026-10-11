// Bài đặc biệt nằm ngoài lộ trình chính, không chặn việc học tiếp.
//  mode "secret": bài ẩn. Hiện dấu "???" kèm gợi ý, tự mở miễn phí khi đạt điều kiện.
//  mode "shop"  : mua bằng xu trong Cửa hàng → tab "Bài học".
// cond.type: streak (chuỗi ngày dài nhất), lessons (số bài đã xong), xp, friends, pet (có thú cưng), harvested (số nông sản đã thu), stars, helped (số lần tưới giúp bạn)
// specs: danh sách "loại:nhóm" giống lộ trình chính (vocab:..., kanji:..., gram:...).
module.exports = [
  // ---------------- bài ẩn ----------------
  { id: 'x_animals', mode: 'secret', title: 'Động vật dễ thương', desc: 'Những con vật đáng yêu nhất.', specs: ['vocab:animals'],
    cond: { type: 'streak', n: 3 }, hint: 'Ai giữ được ngọn lửa học bài ba ngày liền sẽ nghe thấy tiếng kêu từ bụi cỏ…' },
  { id: 'x_family', mode: 'secret', title: 'Gia đình mình', desc: 'Cách gọi người trong nhà mình.', specs: ['vocab:family2'],
    cond: { type: 'lessons', n: 8 }, hint: 'Người chăm chỉ làm xong tám bài sẽ được mời về nhà.' },
  { id: 'x_pet', mode: 'secret', title: 'Nói chuyện với thú cưng', desc: 'Những câu để trò chuyện với bé.', specs: ['vocab:petcare'],
    cond: { type: 'pet' }, hint: 'Có một người bạn bốn chân đang chờ bạn ở ngoài vườn…' },
  { id: 'x_season', mode: 'secret', title: 'Bốn mùa và thời tiết', desc: 'Xuân, hạ, thu, đông.', specs: ['vocab:seasons'],
    cond: { type: 'harvested', n: 3 }, hint: 'Người trồng được quả đầu tiên sẽ hiểu bốn mùa chảy qua thế nào.' },
  { id: 'x_anime', mode: 'secret', title: 'Tiếng lóng anime', desc: 'Từ hay gặp trong phim và truyện tranh.', specs: ['vocab:anime'],
    cond: { type: 'friends', n: 1 }, hint: 'Cần một người bạn cùng mê để mở ra bí mật này.' },
  { id: 'x_kanji_family', mode: 'secret', title: 'Kanji: gia đình', desc: 'Chữ Hán về anh chị em và gia đình.', specs: ['kanji:kFamily'],
    cond: { type: 'streak', n: 7 }, hint: 'Bảy ngày liên tiếp… cửa nhà đã mở.' },
  { id: 'x_festival', mode: 'secret', title: 'Lễ hội và lời chúc', desc: 'Matsuri, pháo hoa và lời chúc.', specs: ['vocab:festival'],
    cond: { type: 'xp', n: 500 }, hint: 'Khi đủ năm trăm điểm kinh nghiệm, tiếng trống lễ hội sẽ vang lên.' },
  { id: 'x_helper', mode: 'secret', title: 'Đếm đồ vật và người', desc: 'Cách đếm của người Nhật.', specs: ['vocab:counters'],
    cond: { type: 'helped', n: 3 }, hint: 'Những người hàng xóm tốt bụng sẽ biết cách đếm số bạn bè của mình.' },
  // ---------------- bài mua trong cửa hàng ----------------
  { id: 's_sushi', mode: 'shop', price: 80, title: 'Thực đơn nhà hàng Nhật', desc: 'Sashimi, tempura, udon… dùng khi đi ăn.', specs: ['vocab:sushi'] },
  { id: 's_school', mode: 'shop', price: 80, title: 'Trong lớp học', desc: 'Đồ dùng và từ vựng ở trường.', specs: ['vocab:school2'] },
  { id: 's_house', mode: 'shop', price: 100, title: 'Trong nhà', desc: 'Phòng bếp, cửa sổ, giường, tủ lạnh…', specs: ['vocab:house'] },
  { id: 's_shopping', mode: 'shop', price: 100, title: 'Mua sắm và quần áo', desc: 'Đi shopping bằng tiếng Nhật.', specs: ['vocab:shopping'] },
  { id: 's_season_kanji', mode: 'shop', price: 120, title: 'Kanji: bốn mùa và thiên nhiên', desc: 'Xuân hạ thu đông, hoa, trời, biển.', specs: ['kanji:kSeason'] },
  { id: 's_travel', mode: 'shop', price: 120, title: 'Du lịch Nhật Bản', desc: 'Sân bay, khách sạn, vé tàu, bản đồ.', specs: ['vocab:travel'] },
  { id: 's_kara_made', mode: 'shop', price: 150, title: 'Ngữ pháp: から・まで', desc: 'Nói "từ ... đến ..." về giờ giấc và nơi chốn.', specs: ['gram:kara_made'] },
  { id: 's_ne_yo', mode: 'shop', price: 150, title: 'Ngữ pháp: ね・よ', desc: 'Làm câu nói tự nhiên như người bản xứ.', specs: ['gram:ne_yo'] }
];
