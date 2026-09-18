const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "gojo_infinite_data.json");
const COOLDOWN_MAP = new Map();

// 100 Lines ng Gojo/Ryuk Lines para sa auto-reply
const MESSAGES = [
  "Bakit kaya ang bilis dumaan ng oras kapag natutulog ka sa klase?",
  "Sabi nila infinite daw ang universe, pero bakit parang limitado ang pasensya ko?",
  "Naisip mo na ba kung ano ang tunay na lasa ng kulay itim?",
  "Sa buong langit at lupa, ako lamang ang nag-iisang honored one.",
  "Minsan nakatingin lang ako sa pader tapos iniisip ko kung may iniisip din kaya siya.",
  "Kung ang isip mo ay parang basurahan, aba'y huwag kang magtaka sa lumalabas dyan.",
  "Hindi ko alam kung sadyang bobo ka lang o nagpapanggap para mapansin.",
  "Ang weird ng mundo, mas mabilis pang masira ang tiwala kaysa sirang payong.",
  "May mga taong parang multo, biglang sumusulpot kapag may kailangan.",
  "Kung ang katangahan ay may buwis, malamang mayaman ka na ngayon.",
  "Minsan kailangan mo ring i-reset ang utak mo, baka sakaling bumalik sa dati.",
  "Ang ganda sana ng araw mo kung hindi ka pinanganak na pabigat.",
  "Bakit kaya kapag tahimik ang isang tao, akala nila mabait na agad?",
  "Isang malalim na buntong-hininga para sa mga taong akala mo alam ang lahat.",
  "Sana sa susunod na buhay mo, maging Wi-Fi ka naman para may silbi ka.",
  "Ang hirap makipagtalo sa taong mas mataas pa ang pride kaysa grades.",
  "Huwag kang mag-ilusyon na mahal ka niya, kaibigan ka lang kapag bored.",
  "Ang weird sumulat ng tadhana, binigyan ka ng mukha kinalimutan ang utak.",
  "Patuloy lang sa pagtakbo ang mundo kahit wala ka namang nararating.",
  "Nakakabinging katahimikan kapag natauhan ka na hindi ka pala importante.",
  "Ubod ka ng galing sa teorya pero sa gawa ay isa kang palamunin.",
  "Minsan mapapaisip ka kung nag-aaral ka ba o nagpapalipas lang ng oras.",
  "Ang galing mo magpayo sa iba pero sa sarili mo ikaw ang pinaka-lost.",
  "May mga taong akala mo hot, yun pala pampainit lang ng ulo.",
  "Huwag mong ipagmalaki ang yabang mo kung ang bulsa mo ay alikabok.",
  "Kung ang pagiging sipsip ay sport, malamang may gold medal ka na.",
  "Ang sarap mabuhay kung wala kang konsensya, tulad mo.",
  "Mag-ingat sa mga taong ngumingiti sa harap habang may kutsilyo sa likod.",
  "Hindi lahat ng kumikinang ay ginto, minsan wrapper lang ng kendi.",
  "Kahit anong pilit mong magpaka-deep, shallow pa rin tingin sa'yo.",
  "Ang lakas ng loob mong manghusga, sarili mo nga di mo kilala.",
  "Pilit mong kinakamay ang tagumpay pero hawakan ang desisyon di mo kaya.",
  "May mga taong ipinanganak para maging bida, ikaw yung nadapa.",
  "Huwag kang magmalaki sa achievement ng iba na parang ikaw ang nagpagod.",
  "Ang sarap pakinggan ng pangarap mo kung hindi lang kasinungalingan.",
  "Kung may award sa pagiging paasa, baka ikaw na ang CEO.",
  "Hindi ka busy, sadyang wala lang silbi ang presensya mo.",
  "Paano mo masasabing tapos ka na eh simula pa lang palpak na?",
  "Mag-isip bago magsalita para di sayang ang laway ng nakikinig.",
  "Ang yabang mo magsalita pero sa simpleng problema iyak ka na.",
  "Taas ng pangarap mo pero mababa ang lipad ng utak mo.",
  "Sana binigyan ka ni Lord ng hiya bukod sa kapal ng mukha.",
  "Huwag mag-alala, hindi ka nag-iisa sa katangahan mo, marami kayo.",
  "Ang galing mo magtago ng sekreto pero bakit ang dali mong mabuko?",
  "Minsan tumingin ka sa salamin para malaman mo sino ang problema.",
  "Parang kanta ka lang na paulit-ulit pero walang kwenta ang lyrics.",
  "Hindi ka special, sadyang mababa lang standard ng pumupuri sa'yo.",
  "Ang bilis mong manghusga parang wala kang kasalanan sa mundo.",
  "Kung may paligsahan sa pagiging bida-bida, ikaw ang champion.",
  "Wala kang mararating kung ang alam mo lang ay magreklamo.",
  "Ang tigas ng mukha mong humingi ng tulong sa sinira mo.",
  "Mag-focus sa sarili bago manghimasok sa buhay ng iba.",
  "Huwag magsabihing malakas ka kung sa simpleng hangin ay tumba ka.",
  "Ang galing mong umarte na ikaw ang biktima kahit ikaw ang may gawa.",
  "Nakakapagod intindihin ang taong sarili lang ang iniisip.",
  "Kung ang katamaran ay may sweldo, milyonaryo ka na.",
  "Ang dami mong sinasabi pero walang laman ang utak mo.",
  "Huwag magmalinis kung ikaw ang pinakamarumi mag-isip.",
  "Sana kasinghaba ng pasensya ko ang buhay mo para matauhan ka.",
  "Ang sarap mong itapon sa ibang planeta para mabawasan ang sakit sa ulo.",
  "Paano mo maipagmamalaki ang sarili kung paninira lang ang gawa mo?",
  "May mga taong akala mo matalino, mas marunong lang magpanggap.",
  "Huwag hintaying magsawa ang mga tao sa ugali mong nakakasuka.",
  "Ang yabang mo sa chat pero sa personal tiklop ka.",
  "Hindi ka cool, mukha ka lang ewan kapag nagmamalaki ka.",
  "Ang sarap mong patulugin nang tuluyan para manahimik ang mundo.",
  "Pilit mong inaangkin ang tagumpay na pinagpagan ng iba.",
  "Magbago ka habang may oras pa, hindi habangbuhay nagtitimpi sila.",
  "Ang galing mong magtago sa fake accounts dahil duwag ka.",
  "Wala kang mararating kung ang hangarin mo ay manghila pababa.",
  "Ang taas ng tingin sa sarili, kuko ka lang naman sa paa.",
  "Masyado kang pabebe para sa edad mong mukhang matanda na.",
  "Huwag mag-inarte kung ikaw ang pasimula ng gulo.",
  "Ang sarap mong bigyan ng award sa pagiging pabigat.",
  "Paulit-ulit na lang ang drama mo, wala na bang bago?",
  "Mag-isip gamit ang utak, hindi gamit ang emosyon mong sabog.",
  "Ang galing mong manisi para maitago ang kapalpakan mo.",
  "Hindi ka kawalan sa grupo, masaya nga sila nung nawala ka.",
  "Ang kapal ng mukha mong humingi ng pabor pagkatapos ng ginawa mo.",
  "Wala ka namang napatunayan para magmaganda nang ganyan.",
  "Ang bilis mong kumampi sa kung saan may pabor sa'yo.",
  "Masyado kang papansin kaya ka binabale-wala.",
  "Huwag maging bida kung hindi mo kaya gampanan ang responsibilidad.",
  "Ang galing mo mamintas, ikaw nga parang dumaan sa giyera ang mukha.",
  "Magtrabaho nang maayos para hindi umasa sa iba.",
  "Ang daldal mo pero walang sustansya ang mga pinagsasabi mo.",
  "Huwag umasang rerespetuhin kung ikaw mismo walang respeto.",
  "Ang taas ng pride pero wala namang maipagmalaki.",
  "Masyado kang reklamador para sa taong walang ambag.",
  "Ang galing mong mangutang pero pagdating sa bayaran nagiging multo.",
  "Huwag magmalaki sa meron ka dahil hiniram mo lang.",
  "Ang sarap mong sapakin paminsan-minsan para matauhan ka.",
  "Wala kang kwentang kasama sa panahong kailangan ka.",
  "Ang bilis mong mang-iiwan sa ere kapag alanganin na.",
  "Mag-isa ka na lang habangbuhay dahil sa ugali mong demonyo.",
  "Ang galing mong magsalita sa talikod pero sa harap sumisipsip.",
  "Hindi ka astig, sadyang salot ka lang sa lipunan.",
  "Tapusin na natin ang usapang ito dahil sayang ang oras.",
  "Isang malaking joke ang buong pagkatao mo, tumawa na lang tayo."
];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (e) {}
  return { active: true };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

// 5 seconds delay bago magpadala ng mensahe na may kasamang typing indicator
function sendWith5SecDelay(api, threadID, text, replyMsgID) {
  if (typeof api.sendTypingIndicator === "function") {
    api.sendTypingIndicator(threadID, () => {});
  }
  setTimeout(() => {
    api.sendMessage(text, threadID, () => {}, replyMsgID);
  }, 5000); // Eksaktong 5 seconds
}

module.exports.config = {
  name: "gojo",
  version: "5.0.0",
  hasPermission: 2,
  credits: "Gojo Framework",
  description: "Gojo Bot: 5s Delay, Auto Self-React 😆, Infinite Nonstop",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, messageID } = event;
  if (!threadID || !senderID) return;

  // Auto self-react ng 😆 sa sariling mensahe o sa natanggap na message
  try {
    setTimeout(() => {
      api.setMessageReaction("😆", messageID, () => {}, true);
    }, 1000);
  } catch (e) {}

  if (senderID === ADMIN_ID) return;

  // Anti-spam para sa ibang users
  const now = Date.now();
  const userCooldown = COOLDOWN_MAP.get(senderID) || 0;
  if (now - userCooldown < 4000) return;
  COOLDOWN_MAP.set(senderID, now);

  const data = loadData();
  if (data.active && Math.random() < 0.20) {
    const randomLine = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    sendWith5SecDelay(api, threadID, `♾️ [Gojo]: ${randomLine}`, messageID);
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  
  if (senderID !== ADMIN_ID) {
    return sendWith5SecDelay(api, threadID, "❌ Paumanhin, tanging ang Admin ID 61594055835097 lamang ang maaaring magbago nito.", messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  let data = loadData();

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return sendWith5SecDelay(api, threadID, "🛑 Gojo Infinite Bot is now OFF.", messageID);
  }

  if (sub === "on") {
    data.active = true;
    saveData(data);
    return sendWith5SecDelay(api, threadID, "🚀 Gojo Infinite Bot is LIVE (5s Delay + Auto Self-React 😆)!", messageID);
  }

  return sendWith5SecDelay(api, threadID, "⚡ Gojo Control Panel | Gamitin ang: /gojo on o /gojo off", messageID);
};
