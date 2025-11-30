const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require("fs");
const path = require("path");

// =====================
// 1. 파일 / 설정 상수
// =====================
const BIRTHDAY_FILE = path.join(__dirname, "birthdays.json");
const BIRTHDAY_CHANNEL_ID = "1260292142543147202";  // 생일 축하 채널
const ROLE_ID = "1260292139493883912";              // 뉴페관리자 역할 ID

// 생일 데이터 로드
let birthdays = {};
try {
  const raw = fs.readFileSync(BIRTHDAY_FILE, "utf8");
  birthdays = JSON.parse(raw);
} catch (e) {
  birthdays = {};
}

function saveBirthdays() {
  fs.writeFileSync(BIRTHDAY_FILE, JSON.stringify(birthdays, null, 2), "utf8");
}

// =====================
// 2. 디스코드 클라이언트
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =====================
// 3. READY EVENT
// =====================
client.on("ready", () => {
  console.log(`로그인 성공: ${client.user.tag}`);

  // 하루 1회 생일 체크 예약
  scheduleDailyBirthdayCheck();
});

// =====================
// 4. 메시지 명령어 처리
// =====================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  // ───────────────────────────
  // !환영
  // ───────────────────────────
  if (msg.content.startsWith("!환영")) {
    const mentionedUser = msg.mentions.users.first();

    if (!mentionedUser) {
      msg.channel.send("누구를 환영할지 멘션해줘! 예: `!환영 @유저`");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#ffc1dc")
      .setDescription(
`┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━»•» 🌸 «•«━┑

　　　　　　　⋅.｡  𐐪 **만담** 𐑂 ‧₊˚⊹

✨ 새로운 별이 찾아왔어요.  
모두 따뜻하게 맞아주세요. 🌙

👉 **${mentionedUser} 님**, 저희 서버에 오신 걸 환영해요.

적응이 어려우시다면  
언제든지 **@🐣⚘⠂◜뉴페관리자◞⠂⚘🐣** 를 찾아주세요.

다른 역할을 원하신다면  
<#1260292141230587974> 에서 자유롭게 받아주세요.

궁금한 점이나 건의 사항이 있다면  
<#1260292142543147198> 에 남겨주시면 감사드릴게요.

편안한 밤, 편안한 대화가 되길 바랄게요. 🌙

┕━»•» 🌸 «•«━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙`
      );

    msg.channel.send({
      content: `<@&${ROLE_ID}>`,
      embeds: [embed]
    });
  }

  // ───────────────────────────
  // !생일등록
  // ───────────────────────────
  if (msg.content.startsWith("!생일등록")) {
    const args = msg.content.trim().split(/\s+/);
    if (args.length < 2) {
      msg.channel.send("사용법: `!생일등록 MM-DD` 예: `!생일등록 12-16`");
      return;
    }

    const date = args[1];
    if (!/^\d{2}-\d{2}$/.test(date)) {
      msg.channel.send("형식이 이상해! `MM-DD` 형식으로 적어줘.");
      return;
    }

    const [mm, dd] = date.split("-");
    if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) {
      msg.channel.send("존재할 수 없는 날짜야. 다시 확인해줘!");
      return;
    }

    const guildId = msg.guild.id;
    if (!birthdays[guildId]) birthdays[guildId] = {};

    birthdays[guildId][msg.author.id] = date;
    saveBirthdays();

    msg.channel.send(`🎂 ${msg.author} 님 생일을 **${date}** 로 저장했어!`);
  }

  // ───────────────────────────
  // !생일삭제
  // ───────────────────────────
  if (msg.content.startsWith("!생일삭제")) {
    const guildId = msg.guild.id;

    if (!birthdays[guildId] || !birthdays[guildId][msg.author.id]) {
      msg.channel.send("삭제할 생일 정보가 없어요!");
      return;
    }

    delete birthdays[guildId][msg.author.id];

    if (Object.keys(birthdays[guildId]).length === 0) {
      delete birthdays[guildId];
    }

    saveBirthdays();
    msg.channel.send("✅ 생일 정보를 삭제했어요.");
  }

  // ───────────────────────────
  // !내생일
  // ───────────────────────────
  if (msg.content.startsWith("!내생일")) {
    const guildId = msg.guild.id;
    const user = msg.author.id;

    if (!birthdays[guildId] || !birthdays[guildId][user]) {
      msg.channel.send("아직 생일이 등록되어 있지 않아요!");
      return;
    }

    msg.channel.send(`🎂 ${msg.author} 님의 생일은 **${birthdays[guildId][user]}** 입니다!`);
  }

  // ───────────────────────────
  // !오늘생일
  // ───────────────────────────
  if (msg.content.startsWith("!오늘생일")) {
    const guildId = msg.guild.id;
    const today = getTodayKST();

    if (!birthdays[guildId]) {
      msg.channel.send("오늘 생일인 멤버가 없어요!");
      return;
    }

    const matches = Object.entries(birthdays[guildId])
      .filter(([_, date]) => date === today);

    if (matches.length === 0) {
      msg.channel.send("오늘 생일인 멤버가 없어요!");
      return;
    }

    let result = "🎉 **오늘 생일인 멤버**\n";
    for (const [userId, date] of matches) {
      result += `- <@${userId}> : ${date}\n`;
    }

    msg.channel.send(result);
  }

  // ───────────────────────────
  // !이번달생일
  // ───────────────────────────
  if (msg.content.startsWith("!이번달생일")) {
    const guildId = msg.guild.id;

    if (!birthdays[guildId]) {
      msg.channel.send("아직 아무도 생일을 등록하지 않았어요!");
      return;
    }

    const now = new Date();
    const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const month = String(kst.getMonth() + 1).padStart(2, "0");

    const matches = Object.entries(birthdays[guildId])
      .filter(([_, date]) => date.startsWith(month));

    if (matches.length === 0) {
      msg.channel.send("이번 달 생일인 멤버가 없어요!");
      return;
    }

    let result = `🎉 **${month}월 생일 멤버 목록**\n`;
    for (const [userId, date] of matches) {
      result += `- <@${userId}> : ${date}\n`;
    }

    msg.channel.send(result);
  }

  // ───────────────────────────
  // !생일명령어
  // ───────────────────────────
  if (msg.content.startsWith("!생일명령어")) {
    msg.channel.send(
`📘 **생일 관련 명령어 목록**

\`!생일등록 MM-DD\` — 생일 등록  
\`!생일삭제\` — 생일 삭제  
\`!내생일\` — 내가 등록한 생일 확인  
\`!오늘생일\` — 오늘 생일 멤버 확인  
\`!이번달생일\` — 이번 달 생일 확인  
\`!생일명령어\` — 명령어 목록`
    );
  }
});

// =====================
// 5. 생일 날짜 처리 / 체크
// =====================
function getTodayKST() {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const mm = String(kst.getMonth() + 1).padStart(2, "0");
  const dd = String(kst.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

// 실제 생일 축하 처리 (하루 1회)
function checkBirthdays() {
  const today = getTodayKST();
  console.log("생일 체크 실행:", today);

  for (const [guildId, users] of Object.entries(birthdays)) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channel = guild.channels.cache.get(BIRTHDAY_CHANNEL_ID);
    if (!channel) continue;

    for (const [userId, date] of Object.entries(users)) {
      if (date === today) {
        channel.send(`@everyone 🎂 오늘은 <@${userId}> 님의 생일이에요! 모두 축하해주세요! 🎉`);
      }
    }
  }
}

// 하루 1회 스케줄링
function scheduleDailyBirthdayCheck() {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));

  const next = new Date(kst);
  next.setHours(0, 5, 0, 0); // 00:05

  // 이미 00:05 지났으면 다음날
  if (kst > next) {
    next.setDate(next.getDate() + 1);
  }

  const delay = next - kst;

  console.log("다음 생일 체크까지 남은 ms:", delay);

  // 첫 실행 예약
  setTimeout(() => {
    checkBirthdays();
    // 이후 매일 24시간 간격 실행
    setInterval(checkBirthdays, 24 * 60 * 60 * 1000);
  }, delay);
}

// =====================
// 6. 로그인
// =====================
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("❌ DISCORD_TOKEN이 설정되어 있지 않습니다.");
  process.exit(1);
}

client.login(token);
