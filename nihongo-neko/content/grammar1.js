// Ngữ pháp N5 - phần 1.
// Câu viết bằng kana, các từ cách nhau bởi dấu cách (giống sách giáo khoa cho người mới học).
// pool: các từ/trợ từ dùng làm đáp án gây nhiễu cho bài điền chỗ trống.
module.exports = [
  { id: 'desu', title: 'A は B です',
    explain: [
      '「A は B です」 nghĩa là "A là B".',
      'は khi làm trợ từ thì đọc là "wa", không đọc là "ha".',
      'です đặt cuối câu để nói lịch sự. Phủ định là 「じゃ ありません」 (không phải là).',
      'さん đặt sau tên người để gọi lịch sự (anh/chị/ông/bà), không dùng cho chính mình.'
    ],
    pool: ['は', 'です', 'じゃ', 'ありません', 'さん'],
    sentences: [
      ['わたし は がくせい です', 'Tôi là học sinh.'],
      ['これ は ほん です', 'Đây là quyển sách.'],
      ['やまだ さん は せんせい です', 'Anh Yamada là giáo viên.'],
      ['わたし は ベトナムじん です', 'Tôi là người Việt Nam.'],
      ['たなか さん は かいしゃいん じゃ ありません', 'Chị Tanaka không phải nhân viên công ty.'],
      ['わたし は エンジニア じゃ ありません', 'Tôi không phải là kỹ sư.']
    ]},
  { id: 'ka_mo', title: 'Câu hỏi か và "cũng" も',
    explain: [
      'Thêm か vào cuối câu để biến thành câu hỏi, không cần đổi vị trí từ.',
      'も nghĩa là "cũng", thay thế cho は khi thông tin giống người trước.',
      'Từ để hỏi: なん (cái gì), だれ (ai).'
    ],
    pool: ['か', 'も', 'は', 'です', 'だれ', 'なん'],
    sentences: [
      ['あなた は にほんじん です か', 'Bạn là người Nhật phải không?'],
      ['たなか さん も せんせい です', 'Anh Tanaka cũng là giáo viên.'],
      ['わたし も がくせい です', 'Tôi cũng là học sinh.'],
      ['これ は なん です か', 'Đây là cái gì vậy?'],
      ['あの ひと は だれ です か', 'Người kia là ai vậy?'],
      ['あなた も かいしゃいん です か', 'Bạn cũng là nhân viên công ty à?']
    ]},
  { id: 'no', title: 'Sở hữu với の',
    explain: [
      '「A の B」 nghĩa là "B của A" (A sở hữu B hoặc A mô tả B).',
      'Ví dụ: わたし の ほん = sách của tôi; にほんご の せんせい = giáo viên tiếng Nhật.',
      'だれ の ～ = "của ai".'
    ],
    pool: ['の', 'は', 'です', 'か', 'を'],
    sentences: [
      ['これ は わたし の ほん です', 'Đây là sách của tôi.'],
      ['あれ は せんせい の かばん です', 'Kia là cặp của giáo viên.'],
      ['わたし は にほんご の がくせい です', 'Tôi là sinh viên tiếng Nhật.'],
      ['あなた の でんわ は どれ です か', 'Điện thoại của bạn là cái nào?'],
      ['やまだ さん の おかあさん は いしゃ です', 'Mẹ của anh Yamada là bác sĩ.'],
      ['それ は だれ の かさ です か', 'Đó là ô của ai vậy?']
    ]},
  { id: 'kore', title: 'これ・それ・あれ và この・その・あの',
    explain: [
      'これ = cái này (gần người nói), それ = cái đó (gần người nghe), あれ = cái kia (xa cả hai).',
      'この・その・あの phải đi kèm danh từ: この ほん (cuốn sách này).',
      'どれ = cái nào, どの = ... nào.'
    ],
    pool: ['これ', 'それ', 'あれ', 'この', 'その', 'あの'],
    sentences: [
      ['これ は ペン です', 'Đây là cái bút.'],
      ['それ は なん です か', 'Đó là cái gì vậy?'],
      ['あれ は わたし の くるま です', 'Kia là xe của tôi.'],
      ['この ほん は あたらしい です', 'Cuốn sách này mới.'],
      ['その かばん は いくら です か', 'Cái cặp đó giá bao nhiêu?'],
      ['あの ひと は わたし の せんせい です', 'Người kia là thầy giáo của tôi.']
    ]},
  { id: 'koko', title: 'ここ・そこ・あそこ・どこ',
    explain: [
      'ここ = ở đây, そこ = ở đó, あそこ = ở kia, どこ = ở đâu.',
      '「A は ここ です」 nghĩa là "A ở đây". Hỏi vị trí: 「A は どこ ですか」.'
    ],
    pool: ['ここ', 'そこ', 'あそこ', 'どこ', 'は', 'です'],
    sentences: [
      ['ここ は がっこう です', 'Đây là trường học.'],
      ['トイレ は あそこ です', 'Nhà vệ sinh ở kia.'],
      ['えき は どこ です か', 'Nhà ga ở đâu vậy?'],
      ['そこ は わたし の へや です', 'Đó là phòng của tôi.'],
      ['ここ は にほん です', 'Đây là Nhật Bản.'],
      ['ぎんこう は あそこ です', 'Ngân hàng ở kia.']
    ]},
  { id: 'masu_wo', title: 'Động từ ます và trợ từ を',
    explain: [
      'Động từ thể lịch sự kết thúc bằng ます (khẳng định) và ません (phủ định). Dùng cho cả hiện tại và tương lai.',
      'を đánh dấu tân ngữ (đối tượng của hành động), đọc là "o": 「ほん を よみます」 = đọc sách.',
      'Đảo thứ tự: động từ luôn đứng cuối câu.'
    ],
    pool: ['を', 'は', 'ます', 'ません', 'か'],
    sentences: [
      ['わたし は まいにち ほん を よみます', 'Mỗi ngày tôi đọc sách.'],
      ['わたし は コーヒー を のみません', 'Tôi không uống cà phê.'],
      ['やまだ さん は さかな を たべます', 'Anh Yamada ăn cá.'],
      ['わたし は テレビ を みます', 'Tôi xem tivi.'],
      ['あなた は なに を かいます か', 'Bạn mua gì vậy?'],
      ['たなか さん は おんがく を ききます', 'Anh Tanaka nghe nhạc.']
    ]},
  { id: 'ni_e', title: 'Đi đến đâu: に và へ',
    explain: [
      'に và へ đứng sau địa điểm để chỉ nơi đến của các động từ như いきます (đi), きます (đến), かえります (về).',
      'へ khi làm trợ từ đọc là "e".',
      'Hỏi: 「どこ へ いきますか」 = đi đâu?'
    ],
    pool: ['に', 'へ', 'を', 'で', 'と'],
    sentences: [
      ['わたし は がっこう へ いきます', 'Tôi đi đến trường.'],
      ['あした うち に かえります', 'Ngày mai tôi về nhà.'],
      ['わたし は まいにち えき へ いきます', 'Mỗi ngày tôi đi ra ga.'],
      ['ともだち は にほん に きます', 'Bạn tôi sẽ đến Nhật Bản.'],
      ['らいしゅう ベトナム へ かえります', 'Tuần sau tôi về Việt Nam.'],
      ['あなた は どこ へ いきます か', 'Bạn đi đâu vậy?']
    ]},
  { id: 'de_to', title: 'Ở đâu, bằng gì, với ai: で và と',
    explain: [
      'で đứng sau địa điểm: nơi diễn ra hành động ("ở ..."). Đứng sau phương tiện: "bằng ...".',
      'と nghĩa là "cùng với": 「ともだち と」 = cùng bạn.',
      'Không nhầm: に chỉ nơi đến, で chỉ nơi hành động xảy ra.'
    ],
    pool: ['で', 'と', 'を', 'へ', 'に'],
    sentences: [
      ['わたし は がっこう で べんきょうします', 'Tôi học ở trường.'],
      ['でんしゃ で かいしゃ へ いきます', 'Tôi đi đến công ty bằng tàu điện.'],
      ['ともだち と えいが を みます', 'Tôi xem phim với bạn.'],
      ['レストラン で ごはん を たべます', 'Tôi ăn cơm ở nhà hàng.'],
      ['バス で がっこう へ いきます', 'Tôi đi đến trường bằng xe buýt.'],
      ['かぞく と にほん へ いきます', 'Tôi đi Nhật Bản cùng gia đình.']
    ]}
];
