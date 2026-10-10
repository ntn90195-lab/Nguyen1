// Ngữ pháp N5 - phần 2.
module.exports = [
  { id: 'jikan', title: 'Giờ giấc: ～じ, に, から, まで',
    explain: [
      'Giờ: いちじ (1 giờ), にじ, さんじ, よじ (4 giờ), ごじ, ろくじ, しちじ (7 giờ), はちじ, くじ (9 giờ), じゅうじ. Hỏi giờ: なんじ.',
      'に đứng sau mốc giờ để chỉ thời điểm hành động xảy ra: 「ろくじ に おきます」.',
      '「A から B まで」 nghĩa là "từ A đến B".'
    ],
    pool: ['に', 'から', 'まで', 'なんじ', 'です'],
    sentences: [
      ['いま なんじ です か', 'Bây giờ là mấy giờ vậy?'],
      ['いま しちじ です', 'Bây giờ là 7 giờ.'],
      ['わたし は ろくじ に おきます', 'Tôi thức dậy lúc 6 giờ.'],
      ['がっこう は くじ から ごじ まで です', 'Trường học từ 9 giờ đến 5 giờ.'],
      ['わたし は じゅうじ に ねます', 'Tôi đi ngủ lúc 10 giờ.'],
      ['まいあさ しちじ に ごはん を たべます', 'Mỗi sáng 7 giờ tôi ăn cơm.']
    ]},
  { id: 'keiyoushi', title: 'Tính từ い và な',
    explain: [
      'Tính từ い kết thúc bằng い: たかい (đắt/cao). Phủ định: bỏ い thêm くない: たかくない です.',
      'Tính từ な: きれい, しずか... Thêm です là xong câu. Phủ định: じゃ ありません.',
      'Khi bổ nghĩa cho danh từ: い giữ nguyên (たかい ほん), な thì thêm な (しんせつ な ひと).'
    ],
    pool: ['たかい', 'たかくない', 'しずか', 'きれい', 'な', 'です'],
    sentences: [
      ['この ほん は たかい です', 'Cuốn sách này đắt.'],
      ['わたし の へや は ちいさい です', 'Phòng của tôi nhỏ.'],
      ['この りんご は おいしい です', 'Quả táo này ngon.'],
      ['ここ は しずか です', 'Chỗ này yên tĩnh.'],
      ['やまだ さん は しんせつ な ひと です', 'Anh Yamada là người tốt bụng.'],
      ['この ほん は たかくない です', 'Cuốn sách này không đắt.']
    ]},
  { id: 'kako', title: 'Thì quá khứ',
    explain: [
      'Động từ: ます → ました (đã làm), ません → ませんでした (đã không làm).',
      'Danh từ / tính từ な: です → でした. Tính từ い: bỏ い thêm かった: さむい → さむかった です.',
      'Từ chỉ thời gian hay đi kèm: きのう (hôm qua), せんしゅう (tuần trước).'
    ],
    pool: ['ました', 'ませんでした', 'でした', 'かった', 'です'],
    sentences: [
      ['きのう わたし は えいが を みました', 'Hôm qua tôi đã xem phim.'],
      ['せんしゅう にほん へ いきました', 'Tuần trước tôi đã đi Nhật Bản.'],
      ['きのう は あめ でした', 'Hôm qua trời mưa.'],
      ['きのう は さむかった です', 'Hôm qua trời lạnh.'],
      ['あさ ごはん を たべませんでした', 'Sáng nay tôi đã không ăn cơm.'],
      ['ともだち と かいもの を しました', 'Tôi đã đi mua sắm với bạn.']
    ]},
  { id: 'aru_iru', title: 'Có / ở: あります và います',
    explain: [
      'あります dùng cho đồ vật, cây cối. います dùng cho người và động vật.',
      '「Nơi chốn に Vật が あります」: "Ở (nơi) có (vật)". が đánh dấu thứ tồn tại.',
      'Từ vị trí: うえ (trên), した (dưới), なか (trong), まえ (trước), うしろ (sau), となり (bên cạnh).'
    ],
    pool: ['が', 'あります', 'います', 'に', 'は'],
    sentences: [
      ['つくえ の うえ に ほん が あります', 'Trên bàn có quyển sách.'],
      ['へや に ねこ が います', 'Trong phòng có con mèo.'],
      ['かばん の なか に ペン が あります', 'Trong cặp có cây bút.'],
      ['えき の まえ に ぎんこう が あります', 'Trước nhà ga có ngân hàng.'],
      ['こうえん に いぬ が います', 'Trong công viên có con chó.'],
      ['わたし の うち の ちかく に がっこう が あります', 'Gần nhà tôi có trường học.']
    ]},
  { id: 'tai', title: 'Muốn và rủ rê: ～たい, ～ませんか, ～ましょう',
    explain: [
      'Bỏ ます, thêm たい: いきます → いきたい (muốn đi). 「にほん へ いきたい です」.',
      '「～ませんか」 dùng để mời: "bạn có ... cùng không?". 「～ましょう」: "cùng ... nhé!".',
      'いっしょ に = cùng nhau.'
    ],
    pool: ['たい', 'ませんか', 'ましょう', 'いっしょ', 'に'],
    sentences: [
      ['わたし は にほん へ いきたい です', 'Tôi muốn đi Nhật Bản.'],
      ['わたし は すし を たべたい です', 'Tôi muốn ăn sushi.'],
      ['いっしょ に コーヒー を のみませんか', 'Bạn uống cà phê cùng tôi không?'],
      ['えいが を みましょう', 'Cùng xem phim nhé!'],
      ['いっしょ に かえりましょう', 'Cùng về nhà nhé!'],
      ['あした なに を したい です か', 'Ngày mai bạn muốn làm gì?']
    ]},
  { id: 'kudasai', title: 'Xin hãy cho tôi: ください và ～ています',
    explain: [
      '「Danh từ を ください」 nghĩa là "xin cho tôi ...". Rất hay dùng khi mua đồ, gọi món.',
      '「～ています」 diễn tả hành động đang diễn ra: たべて います = đang ăn. (Bạn sẽ học thể て kỹ hơn sau.)'
    ],
    pool: ['ください', 'て', 'います', 'を', 'で'],
    sentences: [
      ['みず を ください', 'Xin cho tôi nước.'],
      ['コーヒー を ください', 'Xin cho tôi cà phê.'],
      ['わたし は いま べんきょう して います', 'Bây giờ tôi đang học bài.'],
      ['ともだち は テレビ を みて います', 'Bạn tôi đang xem tivi.'],
      ['やまだ さん は かいしゃ で はたらいて います', 'Anh Yamada đang làm việc ở công ty.'],
      ['いま ごはん を たべて います', 'Bây giờ tôi đang ăn cơm.']
    ]},
  { id: 'suki', title: 'Thích, ghét, giỏi, dở với が',
    explain: [
      'Với すき (thích), きらい (ghét), じょうず (giỏi), へた (dở), đối tượng được đánh dấu bằng が (không dùng を).',
      '「わたし は ねこ が すき です」 = Tôi thích mèo.'
    ],
    pool: ['が', 'は', 'すき', 'きらい', 'じょうず', 'へた'],
    sentences: [
      ['わたし は ねこ が すき です', 'Tôi thích mèo.'],
      ['わたし は りょうり が じょうず です', 'Tôi nấu ăn giỏi.'],
      ['たなか さん は スポーツ が すき です', 'Anh Tanaka thích thể thao.'],
      ['わたし は さかな が きらい です', 'Tôi ghét (không thích) cá.'],
      ['やまだ さん は にほんご が じょうず です', 'Anh Yamada giỏi tiếng Nhật.'],
      ['わたし は ゲーム が へた です', 'Tôi chơi game dở.']
    ]}
];
