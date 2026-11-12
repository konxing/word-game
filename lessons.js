/* 所有关卡均内置于本地，无须网络或帐号。 */
(function (root) {
  'use strict';
  const lessons = [
    { id: '01', phase: '认识键盘', title: '找到 F 和 J', mode: 'key', description: '两只食指放在 F 和 J 上。摸摸键帽的小凸起，再照着屏幕按。', items: ['f','j','f','j','j','f'], hint: '先找键盘中间一排的 F、J，慢慢按，不用快。' },
    { id: '02', phase: '认识键盘', title: '认识左手四个键', mode: 'key', description: '练习左手的 A、S、D、F 四个键，记住它们的位置。', items: ['f','d','s','a','a','s','d','f'], hint: '左手小指到食指，依次放在 A、S、D、F。' },
    { id: '03', phase: '认识键盘', title: '认识右手四个键', mode: 'key', description: '右手练习 J、K、L 和分号键。', items: ['j','k','l',';',';','l','k','j'], hint: '右手食指到小指，依次放在 J、K、L、分号。' },
    { id: '04', phase: '认识键盘', title: '中间一排练熟', mode: 'key', description: '把左右两手放在中间一排，一起练习。', items: ['a','j','s','k','d','l','f',';','g','h','f','j','g','h','a',';'], hint: 'G 用左手食指，H 用右手食指。' },
    { id: '05', phase: '认识键盘', title: '左上方的字母', mode: 'key', description: '从中间一排伸手，找到 Q、W、E、R、T。', items: ['q','w','e','r','t','t','r','e','w','q','w','r','q','t','e'], hint: '每按完一个键，手指可以回到中间一排。' },
    { id: '06', phase: '认识键盘', title: '右上方的字母', mode: 'key', description: '认识 Y、U、I、O、P 五个键。', items: ['y','u','i','o','p','p','o','i','u','y','u','o','y','p','i'], hint: '先找 J，再往上找 Y、U、I、O、P。' },
    { id: '07', phase: '认识键盘', title: '下方一排字母', mode: 'key', description: '练习 Z、X、C、V、B、N、M。', items: ['z','x','c','v','b','n','m','m','n','b','v','c','x','z'], hint: '看下方亮起的键，找准以后再按。' },
    { id: '08', phase: '认识键盘', title: '数字也会打', mode: 'key', description: '看清键盘最上方的数字，从 1 练到 0。', items: ['1','2','3','4','5','6','7','8','9','0','5','1','9','3','7'], hint: '这里用键盘上方的数字键就可以，数字小键盘也可以。' },
    { id: '09', phase: '认识键盘', title: '空格和回车', mode: 'key', description: '认识最长的空格键，以及右边较大的回车键。', items: [' ','Enter',' ','Enter',' ',' ','Enter',' ','Enter',' '], hint: '空格键在最下面，中间位置；回车键通常在右手边。' },
    { id: '10', phase: '拼音与字母', title: '拼音里的短词', mode: 'latin', description: '先输入生活中熟悉的拼音词，不必记英语单词。', items: ['ba','ma','jia','ming zi','shou ji'], hint: '每次只要按亮起的那个字母，打错不会把已经打对的字清掉。' },
    { id: '11', phase: '拼音与字母', title: '常见的拼音', mode: 'latin', description: '像拼音一样把字母打出来。这一关保持英文输入，不需要选汉字。', items: ['ni hao','xie xie','zao shang hao','wo hui da zi'], hint: '两个词之间，按一下最长的空格键。这关只打拼音字母。' },
    { id: '12', phase: '拼音与字母', title: '拼音连起来', mode: 'latin', description: '练习更长一点的拼音组合，慢慢打出完整一行。', items: ['jin tian tian qi hao','wo xi huan xue xi','mei tian jin bu yi dian'], hint: '看准亮起的字母，空格也要按，速度不是目标。' },
    { id: '13', phase: '中文输入', title: '第一句中文', mode: 'hanzi', description: '开始用 Windows 自带的中文拼音输入法，打出完整的汉字。', items: ['你好','谢谢','早上好','我会打字了'], hint: '在输入框中输入拼音，再从输入法候选字里选出正确的汉字。' },
    { id: '14', phase: '中文输入', title: '日常会用的话', mode: 'hanzi', description: '练习生活里经常说的句子。慢慢选字，内容相同就能过关。', items: ['今天过得不错','我正在练习打字','学习可以慢慢来'], hint: '选错字没关系，用退格键改好就行。' },
    { id: '15', phase: '中文输入', title: '礼貌交流', mode: 'hanzi', description: '把学会的打字能力用在日常交流里。', items: ['请问现在几点','麻烦你了','祝你身体健康'], hint: '一边看屏幕上的句子，一边用拼音输入法选字。' },
    { id: '16', phase: '中文输入', title: '毕业小练习', mode: 'hanzi', description: '能独立打出这几句话，就已经迈出了重要的一步。', items: ['电脑打字并不难','我能自己打出中文了','每天练一点就会更熟练'], hint: '恭喜走到这里。不用比较速度，能独立完成就是进步。' }
  ];
  root.TYPING_LESSONS = lessons;
  if (typeof module !== 'undefined' && module.exports) module.exports = lessons;
})(typeof window !== 'undefined' ? window : globalThis);
