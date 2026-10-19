# حدود النشر

المستودع عام. يُنشر التوثيق العام وأدوات التنظيم، إضافة إلى ملفات المشاريع التي تمت مراجعتها وإدراجها صراحة في قائمة النشر.

الاستثناء المراجع: `services/changelog-bounty/` — سبعة ملفات مصدر/ترخيص/توثيق/اختبارات وعينة من تاريخ Git العام. لا يتضمن مراسلات أو معرفات بريد أو بيانات عملاء خاصة.

استثناءان إضافيان مراجعان: `services/bash-guard/` (ستة ملفات) و`services/next-sqlite-template/` (15 ملفًا). ملفات المصدر والتوثيق والاختبارات والقفل فقط؛ قواعد البيانات والاعتماديات والمراسلات مستبعدة.

## لا يُنشر تلقائيًا
- البريد، أسماء العملاء ومعلوماتهم، المسودات، كشوف المدفوعات، أو معرفات الرسائل.
- روابط Drive الخاصة، وثائق الفريق، التقارير الأمنية غير المنشورة، ملفات البيئة أو مفاتيح الدخول.
- الحزم المضغوطة ونسخ المشاريع الخارجية قبل مراجعة المحتوى والترخيص.

## قبل كل commit
1. أضف الملفات بأسمائها، لا تستخدم `git add .` على مساحة عمل تحتوي بيانات خاصة.
2. نفّذ `git diff --cached --stat` ثم راجع الفرق كاملًا.
3. نفّذ `python3 scripts/check_public_boundary.py`.
4. راجع المحتوى نفسه؛ فحص المسارات ليس كاشف أسرار.

توسيع قائمة النشر يتطلب مراجعة فعلية، ولا يتم بإجبار Git على إضافة ملفات متجاهلة. جميع الأعمال على فرع الجلسة الحالي؛ لا تعديل أو حذف لفروع أخرى ضمن التنظيم.

## Portfolio Studio
`services/portfolio-studio/` is a reviewed public frontend collection: source, entry pages, project READMEs, tests, screenshots, license and development dependency lockfile. No client records or credentials. `index.html` and `.nojekyll` support optional static hosting of the collection. Runtime data and browser test artifacts stay untracked.
