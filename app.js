// --- Supabase and TWA Init ---
const tg = window.Telegram?.WebApp || {
    initDataUnsafe: { user: { id: 1234567, first_name: "Test" } },
    expand: () => console.log("Telegram mocked expand"),
    ready: () => console.log("Telegram mocked ready"),
};

// Configured Keys
const SUPABASE_URL = 'https://bmnubvudieaeidptuhhq.supabase.co';
// Use Publishable key for Frontend
const SUPABASE_ANON_KEY = 'sb_publishable_KrNqXfKfQlToEHXzzEU9tA_o-yLg15m'; 
const TG_BOT_TOKEN = '8649368118:AAF_jGsRAitirQQs4oQ7iPpZ07EZ2icO4r4'; // Kept for backend logic

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const app = {
    user: null,
    currentTab: 'chronicle',
    
    init() {
        if(tg.expand) tg.expand();
        if(tg.ready) tg.ready();
        
        // PWA Header colors setup (тимуридский тёмный)
        if(window.Telegram && window.Telegram.WebApp) {
            if(window.Telegram.WebApp.setHeaderColor) window.Telegram.WebApp.setHeaderColor('#26233a');
            if(window.Telegram.WebApp.setBackgroundColor) window.Telegram.WebApp.setBackgroundColor('#26233a');
        }
        
        document.getElementById('onboarding-form').addEventListener('submit', this.handleOnboarding.bind(this));
        
        // Gallery Handlers
        document.getElementById('btn-add-photo').addEventListener('click', () => {
             if(this.user && this.user.is_banned_photo) {
                 alert("Вам запрещено загружать фото.");
                 return;
             }
             document.getElementById('upload-reel-file').click();
        });
        document.getElementById('upload-reel-file').addEventListener('change', this.handlePhotoSelection.bind(this));
        document.getElementById('upload-reel-file').addEventListener('change', this.handlePhotoSelection.bind(this));

        // Admin Forms
        document.getElementById('form-add-chronicle').addEventListener('submit', this.adminAddChronicle.bind(this));
        document.getElementById('form-add-quiz').addEventListener('submit', this.adminAddQuiz.bind(this));
        
        const chronicleFileInput = document.getElementById('ac-img-file');
        if(chronicleFileInput) {
            chronicleFileInput.addEventListener('change', (e) => {
                const label = document.getElementById('ac-file-label');
                if(e.target.files[0]) {
                    label.textContent = e.target.files[0].name.substring(0,25) + '...';
                    label.classList.add('text-secondary');
                } else {
                    label.textContent = 'Выберите Изображение из телефона';
                    label.classList.remove('text-secondary');
                }
            });
        }

        // Start Flow
        if(supabaseClient) {
            this.checkUser();
        } else {
            console.warn("Supabase not defined! Run in environment with Supabase script.");
            if (typeof removeLoader !== 'undefined') removeLoader();
            document.getElementById('screen-onboarding').style.display = 'flex';
        }
    },

    async checkUser() {
        try {
            const uid = tg.initDataUnsafe?.user?.id;
            if(!uid) throw new Error("No Telegram User ID");
            
            // Schema updated: tg_id instead of id
            const { data, error } = await supabaseClient.from('users').select('*').eq('tg_id', uid).single();
            if(error && error.code !== 'PGRST116') console.error(error); // PGRST116 is not found
            
            if(data) {
                this.user = data;
                this.bootMainApp();
            } else {
                document.getElementById('screen-onboarding').style.display = 'flex';
            }
        } catch(e) {
            console.error("Auth check failed:", e);
            document.getElementById('screen-onboarding').style.display = 'flex';
        }
    },

    async handleOnboarding(e) {
        e.preventDefault();
        const name = document.getElementById('on-name').value.trim();
        const cls = document.getElementById('on-class').value;
        const letter = document.getElementById('on-letter').value;
        const uid = tg.initDataUnsafe?.user?.id || Date.now();
        
        // 1. Check if name already exists
        const { data: existingUser } = await supabaseClient
            .from('users')
            .select('tg_id')
            .eq('full_name->>text', name)
            .maybeSingle();

        if (existingUser && existingUser.tg_id !== uid) {
            alert("Это имя уже занято! Пожалуйста, добавьте к имени первую букву фамилии или используйте другое имя.");
            return;
        }

        // Match user schema exactly
        const payload = {
            tg_id: uid,
            full_name: { text: name },
            class_info: { num: parseInt(cls), letter: letter },
            is_admin: false,
            is_banned_photo: false
        };

        const { error } = await supabaseClient.from('users').upsert(payload, { onConflict: 'tg_id' });
        if(!error) {
            this.user = payload;
            document.getElementById('screen-onboarding').style.display = 'none';
            this.bootMainApp();
        } else {
            console.error(error);
            alert("Ошибка при регистрации");
        }
    },

    async bootMainApp() {
        document.getElementById('screen-main').style.display = 'flex';
        document.getElementById('screen-onboarding').style.display = 'none';
        
        // Setup header
        if(this.user) {
            // Aggregate score from quiz_results
            const { data: qRes } = await supabaseClient.from('quiz_results').select('score').eq('user_id', this.user.tg_id);
            const totalScore = qRes ? qRes.reduce((a, b) => a + b.score, 0) : 0;
            this.user.points = totalScore;
            
            document.getElementById('header-points').textContent = totalScore + " очк.";
            document.getElementById('header-points').classList.remove('hidden');
            document.getElementById('user-total-score').textContent = totalScore;

            // Update Avatar Name
            const headerAvatar = document.getElementById('header-avatar');
            if(headerAvatar) {
                let nameStr = 'А'; // default
                if(this.user.full_name && this.user.full_name.text) {
                    nameStr = this.user.full_name.text.charAt(0).toUpperCase();
                }
                // Тимуридский аватар: тёмно-фиолетовый фон + золото
                headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=1a1338&color=c9a227&bold=true`;
            }
            
            // Show Admin Tab if applicable
            if(this.user.is_admin) {
                document.getElementById('tab-btn-admin').classList.remove('hidden');
            }
        }

        this.switchTab('chronicle');
    },

    // --- Routing ---
    switchTab(tabName) {
        // Сброс всех вкладок (тимуридский стиль)
        document.querySelectorAll('.nav-tab').forEach(el => {
            el.querySelector('.nav-icon').classList.remove('fill-icon');
            el.classList.remove('active-tab');
            el.style.color = 'rgba(181,168,130,0.5)';
        });

        const activeEl = document.getElementById(`tab-btn-${tabName}`);
        if(activeEl) {
            activeEl.classList.add('active-tab');
            // Цвет Админ вкладки — рубин, остальных — золото
            activeEl.style.color = tabName === 'admin' ? '#c44a5a' : '#c9a227';
            activeEl.querySelector('.nav-icon').classList.add('fill-icon');
        }

        document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        
        const cTab = document.getElementById(`tab-${tabName}`);
        if(cTab) {
            if(tabName === 'gallery') {
                cTab.style.display = 'block'; 
                document.getElementById('main-header').classList.add('hidden');
                document.getElementById('gallery-header').classList.remove('hidden');
            } else {
                cTab.style.display = 'block';
                document.getElementById('main-header').classList.remove('hidden');
                document.getElementById('gallery-header').classList.add('hidden');
            }
        }

        this.currentTab = tabName;
        
        if(tabName === 'chronicle') this.loadChronicle();
        if(tabName === 'quizzes') this.loadQuizzes();
        if(tabName === 'gallery') this.loadGallery();
        if(tabName === 'admin') this.loadAdminPanel();
    },

    // --- Chronicle Content ---
    async loadChronicle() {
        const feed = document.getElementById('chronicle-feed');
        feed.innerHTML = '<p class="text-center" style="color:rgba(181,168,130,0.5);">Загрузка летописи...</p>';
        const { data, error } = await supabaseClient.from('posts').select('*, users(full_name)').order('created_at', { ascending: false });
        if(error || !data) {
            feed.innerHTML = '<p class="text-center" style="color:#c44a5a;">Ошибка загрузки</p>';
            return;
        }

        feed.innerHTML = '';
        data.forEach(post => {
            let titleText = 'Новая Запись';
            let contentText = post.text_content;
            try {
                const parsed = JSON.parse(post.text_content);
                if(parsed.title && parsed.content) {
                    titleText = parsed.title;
                    contentText = parsed.content;
                }
            } catch(e) {} // Fallback to raw text_content

            const sqTitle = titleText.replace(/'/g, "\\'").replace(/\n/g, ' ');
            const sqDesc = contentText.replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/"/g, '&quot;');
            const sqImg = post.image_url || 'https://images.unsplash.com/photo-1590494056294-84d72023d6a2?auto=format&fit=crop&q=80&w=600';

            const article = document.createElement('article');
            article.className = "group rounded-2xl overflow-hidden";
            article.style.cssText = "background:linear-gradient(145deg,#3b2f5c,#2d2745);border:1px solid rgba(201,162,39,0.15);box-shadow:0 8px 32px rgba(0,0,0,0.4);";
            article.innerHTML = `
                <div class="relative h-56 overflow-hidden">
                    <img alt="Post cover" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="${sqImg}"/>
                    <div class="absolute inset-0" style="background:linear-gradient(to top, #2d2745 0%, transparent 60%);"></div>
                    <div class="absolute top-4 left-4 tag-chronicle">Летопись</div>
                </div>
                <div class="p-5">
                    <h2 class="font-headline text-xl font-bold mb-3 tracking-wide" style="color:#f5d67a;">${titleText}</h2>
                    <div class="gold-divider mb-3"></div>
                    <p class="font-serif leading-relaxed italic mb-5 line-clamp-4" style="color:rgba(232,221,196,0.8);font-size:0.9rem;">${contentText}</p>
                    <div class="flex items-center justify-between pt-3" style="border-top:1px solid rgba(201,162,39,0.1);">
                        <button class="btn-save-chronicle px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95" onclick="app.shareStory('${sqTitle}', '${sqDesc}', '${sqImg}')">
                            <span class="material-symbols-outlined text-lg" data-icon="download">download</span>
                            <span class="font-body text-xs font-bold">Сохранить</span>
                        </button>
                    </div>
                </div>
            `;
            feed.appendChild(article);
        });
    },

    shareStory(titleText, descText, imgUrl) {
        const canvas = document.getElementById('story-canvas');
        const ctx = canvas.getContext('2d');
        const postImg = new Image();
        postImg.crossOrigin = "Anonymous";
        postImg.src = imgUrl;

        postImg.onload = () => {
            // Draw gradient background
            const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
            bgGrad.addColorStop(0, "#0b1326");
            bgGrad.addColorStop(1, "#00164e");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1080, 1920);

            // Draw blurred/darkened image as background layer
            const coverRatio = 1080/1920;
            const imgRatio = postImg.width / postImg.height;
            let sx, sy, sw, sh;
            if (imgRatio > coverRatio) {
                sh = postImg.height; sw = postImg.height * coverRatio;
                sx = (postImg.width - sw) / 2; sy = 0;
            } else {
                sw = postImg.width; sh = postImg.width / coverRatio;
                sx = 0; sy = (postImg.height - sh) / 2;
            }
            ctx.globalAlpha = 0.3;
            ctx.drawImage(postImg, sx, sy, sw, sh, 0, 0, 1080, 1920);
            ctx.globalAlpha = 1.0;

            // Draw Card Container
            ctx.fillStyle = "rgba(23, 31, 51, 0.9)"; 
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.roundRect(80, 400, 920, 1100, 60);
            ctx.fill();
            ctx.shadowBlur = 0; // reset

            // Draw Image inside the card (Height: 500)
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(80, 400, 920, 500, 60);
            ctx.fill();
            ctx.clip();
            const cRatio2 = 920/500;
            let sx2, sy2, sw2, sh2;
            if (imgRatio > cRatio2) {
                sh2 = postImg.height; sw2 = postImg.height * cRatio2;
                sx2 = (postImg.width - sw2) / 2; sy2 = 0;
            } else {
                sw2 = postImg.width; sh2 = postImg.width / cRatio2;
                sx2 = 0; sy2 = (postImg.height - sh2) / 2;
            }
            ctx.drawImage(postImg, sx2, sy2, sw2, sh2, 80, 400, 920, 500);
            ctx.restore();

            // Gradient fade below image
            const grad = ctx.createLinearGradient(0, 800, 0, 950);
            grad.addColorStop(0, "rgba(23, 31, 51, 0)");
            grad.addColorStop(1, "rgba(23, 31, 51, 1)");
            ctx.fillStyle = grad;
            ctx.fillRect(80, 800, 920, 150);

            // Title
            ctx.font = "bold 64px serif";
            ctx.fillStyle = "#e9c400";
            ctx.textAlign = "center";
            let y = 1000;
            const titleLines = this.getLines(ctx, titleText, 800);
            titleLines.forEach(line => {
                ctx.fillText(line, 540, y);
                y += 75;
            });

            // Description
            ctx.font = "italic 44px sans-serif";
            ctx.fillStyle = "#dae2fd";
            y += 10;
            const descLines = this.getLines(ctx, descText, 800);
            const maxDescLines = 4;
            for(let i=0; i<Math.min(descLines.length, maxDescLines); i++) {
                ctx.fillText(descLines[i], 540, y);
                y += 55;
            }
            if(descLines.length > maxDescLines) ctx.fillText("...", 540, y);

            // Labels
            ctx.font = "bold 48px sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("Наследие Амира Темура", 540, 300);

            ctx.font = "bold 40px sans-serif";
            ctx.fillStyle = "#43e2d2"; 
            ctx.fillText("@UzGatorBot", 540, 1700);

            // Download — Mobile-safe approach
            const dataUrl = canvas.toDataURL("image/png");

            // 1. Try Telegram native share (works in Telegram mobile)
            if(window.Telegram?.WebApp?.shareToStory) {
                window.Telegram.WebApp.shareToStory(dataUrl, {
                    text: `Наследие Амира Темура | @UzGatorBot`
                });
            } else {
                // 2. Open blob in new tab — works on iOS Safari & Android Chrome natively
                canvas.toBlob((blob) => {
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `fact_${Date.now()}.png`;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                    }, 1000);
                }, 'image/png');

                if(window.Telegram?.WebApp?.showPopup) {
                    window.Telegram.WebApp.showPopup({message: "Нажмите «Сохранить» на открывшейся вкладке браузера!"});
                }
            }
        };

        postImg.onerror = () => {
            alert("Ошибка загрузки изображения.");
        };
    },

    getLines(ctx, text, maxWidth) {
        let words = text.split(" ");
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    },

    // --- Quizzes ---
    async loadQuizzes() {
        const feed = document.getElementById('quizzes-feed');
        feed.innerHTML = '<p class="text-center">Загрузка...</p>';
        const { data: quizzes, error } = await supabaseClient.from('quizzes').select('*');
        if(error || !quizzes) return;
        
        const { data: results } = await supabaseClient.from('quiz_results').select('*').eq('user_id', this.user?.tg_id);
        const resultDict = {};
        if(results) {
            results.forEach(r => { resultDict[r.quiz_id] = r; });
        }

        document.getElementById('quizzes-count').textContent = `Всего: ${quizzes.length}`;
        feed.innerHTML = '';
        const now = new Date();

        quizzes.forEach(quiz => {
            const hasResult = !!resultDict[quiz.id];
            const end = new Date(quiz.end_time);
            const isActive = now < end;
            
            let html = '';
            if (hasResult || !isActive) {
                const p = resultDict[quiz.id]?.score || 0;
                html = `
                <div class="rounded-2xl p-5" style="background:rgba(62,52,94,0.5);border:1px solid rgba(201,162,39,0.1);opacity:0.75;">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-headline text-base" style="color:rgba(232,221,196,0.6);">${quiz.title}</h4>
                        <span class="font-body text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider" style="background:rgba(201,162,39,0.1);color:rgba(201,162,39,0.5);">Завершено</span>
                    </div>
                    <div class="gold-divider my-3"></div>
                    <div class="rounded-xl p-3 flex items-center justify-around" style="background:rgba(38,35,58,0.5);">
                        <div class="flex flex-col items-center">
                            <span class="font-body text-xs uppercase mb-1 tracking-wider" style="color:rgba(181,168,130,0.5);">Очки</span>
                            <span class="font-headline text-xl font-bold" style="color:#c9a227;">${p}</span>
                        </div>
                    </div>
                </div>`;
            } else {
                html = `
                <div class="group rounded-2xl p-5 relative overflow-hidden">
                    <div class="absolute left-0 top-4 bottom-4 w-0.5" style="background:linear-gradient(180deg,#c9a227,transparent);"></div>
                    <div class="flex justify-between items-start mb-3 pl-3">
                        <div>
                            <div class="font-body text-[10px] font-bold uppercase tracking-widest mb-1" style="color:rgba(201,162,39,0.6);">Испытание</div>
                            <h4 class="font-headline text-lg" style="color:#f5d67a;">${quiz.title}</h4>
                        </div>
                        <span class="material-symbols-outlined" data-icon="stars" style="color:#c9a227;font-variation-settings:'FILL' 1;">stars</span>
                    </div>
                    <button class="w-full py-3 rounded-xl font-headline font-bold flex items-center justify-center gap-2 mt-3 active:scale-95 transition-all text-sm tracking-wide inner-glow" style="background:linear-gradient(135deg,#c9a227,#8a6b18);color:#26233a;box-shadow:0 4px 16px rgba(201,162,39,0.25);" onclick="app.openQuiz('${quiz.id}', ${hasResult})">
                        <span>Начать испытание</span>
                        <span class="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
                    </button>
                </div>`;
            }
            feed.innerHTML += html;
        });
        
        this.cacheQuizzes = quizzes;
    },

    async openQuiz(id, alreadyDone) {
        if(alreadyDone) return alert("Вы уже прошли это испытание!");
        const quiz = this.cacheQuizzes.find(q => q.id === id);
        if(!quiz) return;
        
        try {
            let parsedQ = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions;
            if(typeof parsedQ === 'string') parsedQ = JSON.parse(parsedQ); // double unwrap
            if(!Array.isArray(parsedQ)) parsedQ = [parsedQ]; // catch if they pasted object without []

            this.currentQuiz = {
                data: quiz,
                questions: parsedQ,
                index: 0,
                score: 0
            };
            document.getElementById('qm-title').textContent = quiz.title;
            this.renderQuizStep();
            document.getElementById('quiz-modal').classList.remove('hidden');
        } catch(e) {
            console.error(e);
        }
    },

    renderQuizStep() {
        const c = this.currentQuiz;
        const qData = c.questions[c.index];
        const container = document.getElementById('qm-content');
        
        if(!qData) {
            container.innerHTML = `<h3 class="font-headline text-xl text-center mb-3" style="color:#f5d67a;">✦ Завершено! ✦</h3><div class="gold-divider my-3"></div><p class="text-center font-serif italic" style="color:rgba(232,221,196,0.8);">Верных ответов: ${c.score} из ${c.questions.length}. Очки будут начислены в казну знаний!</p>`;
            document.getElementById('qm-actions').innerHTML = `<button onclick="app.submitQuizScore()" class="font-headline font-bold px-6 py-3 rounded-xl text-sm tracking-wide" style="background:linear-gradient(135deg,#c9a227,#8a6b18);color:#26233a;">Завершить</button>`;
            return;
        }

        let optsHtml = '';
        qData.options.forEach((opt, idx) => {
            optsHtml += `<button onclick="app.answerQuiz(${idx}, ${qData.correct})" class="w-full text-left p-4 rounded-xl mb-2 transition-all active:scale-98 font-body text-sm" style="background:rgba(38,35,58,0.8);border:1px solid rgba(201,162,39,0.15);color:#e8ddc4;">${opt}</button>`;
        });

        container.innerHTML = `
            <p class="font-body text-[10px] uppercase tracking-widest mb-2" style="color:rgba(201,162,39,0.6);">Вопрос ${c.index + 1} из ${c.questions.length}</p>
            <h4 class="font-headline text-lg leading-tight mb-4" style="color:#f5d67a;">${qData.q}</h4>
            <div class="space-y-2">${optsHtml}</div>
        `;
        document.getElementById('qm-actions').innerHTML = '';
    },

    answerQuiz(selectedIdx, correctIdx) {
        const c = this.currentQuiz;
        if(selectedIdx === correctIdx) c.score += 1;
        c.index++;
        this.renderQuizStep();
    },

    async submitQuizScore() {
        const addedScore = this.currentQuiz.score * 10;
        await supabaseClient.from('quiz_results').insert({
            user_id: this.user.tg_id,
            quiz_id: this.currentQuiz.data.id,
            score: addedScore,
            answers_log: {}
        });

        // Add to local UI points
        const newPts = (this.user.points || 0) + addedScore;
        this.user.points = newPts;
        document.getElementById('header-points').textContent = newPts + " очк.";
        document.getElementById('user-total-score').textContent = newPts;
        
        this.closeQuiz();
        this.loadQuizzes();
    },

    closeQuiz() {
        document.getElementById('quiz-modal').classList.add('hidden');
        this.currentQuiz = null;
    },

    // --- Gallery ---
    async loadGallery() {
        const feed = document.getElementById('gallery-feed');
        feed.innerHTML = '';
        
        const { data, error } = await supabaseClient.from('gallery').select('*').eq('is_moderated', true).order('created_at', {ascending: false});
        if(error) console.error("Gallery Load Error:", error);
        
        if(error || !data || data.length === 0) {
            feed.innerHTML = '<p class="text-center text-white pt-24">Нет доступных материалов</p>';
            return;
        }

        // Local Join for users
        const userIds = [...new Set(data.map(g => g.user_id))];
        const { data: usersData } = await supabaseClient.from('users').select('tg_id, full_name').in('tg_id', userIds);
        const userMap = {};
        if (usersData) usersData.forEach(u => { userMap[u.tg_id] = u.full_name?.text; });

        const myId = this.user.tg_id;

        data.forEach(item => {
            const userName = userMap[item.user_id] || 'резидент';
            // likes is now an array of user_ids stored in gallery.likes
            const likesList = Array.isArray(item.likes) ? item.likes : [];
            const isLiked = likesList.includes(myId);
            const likeCount = likesList.length;

            const section = document.createElement('section');
            section.className = "relative h-[100dvh] w-full flex flex-col items-center justify-center snap-start shrink-0 bg-black";
            section.innerHTML = `
                <!-- 9:16 Photo Container -->
                <div class="relative w-full max-w-[calc(100dvh*9/16)] h-full overflow-hidden">
                    <img alt="Reel" class="absolute inset-0 w-full h-full object-cover" src="${item.photo_url}"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div class="relative w-full px-6 pb-32 flex justify-between items-end">
                        <div class="max-w-[70%] mb-4">
                            <div class="flex items-center gap-3 mb-2">
                                <p class="font-label font-bold text-sm text-secondary">@${userName.replace(/\s+/g,'_').toLowerCase()}</p>
                            </div>
                            <h2 class="font-headline italic text-xl text-white leading-tight drop-shadow-lg">${item.caption || ''}</h2>
                        </div>
                        <div class="flex flex-col gap-6 items-center">
                            <button class="group flex flex-col items-center gap-1" id="like-btn-${item.id}" onclick="app.toggleLike('${item.id}')">
                                <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform active:scale-125">
                                    <span class="material-symbols-outlined transition-all" id="like-icon-${item.id}"
                                        style="color: ${isLiked ? '#ffb4ab' : 'white'}; font-variation-settings: 'FILL' ${isLiked ? 1 : 0}">
                                        favorite
                                    </span>
                                </div>
                                <span class="text-white text-xs font-bold" id="like-count-${item.id}">${likeCount > 0 ? likeCount : ''}</span>
                            </button>
                            <button class="group flex flex-col items-center gap-1" onclick="app.saveBookmark('${item.id}')">
                                <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform active:scale-125">
                                    <span class="material-symbols-outlined text-white" id="bm-icon-${item.id}" data-icon="bookmark_add">bookmark_add</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            feed.appendChild(section);
        });
    },

    handlePhotoSelection(e) {
        const file = e.target.files[0];
        if(!file) return;
        this.pendingUploadFile = file;
        document.getElementById('upload-modal').classList.remove('hidden');
    },

    async submitReel() {
        const file = this.pendingUploadFile;
        const desc = document.getElementById('upload-desc').value;
        if(!file || !desc) return alert("Выберите фото и добавьте подпись");

        const btn = document.querySelector('#upload-modal button.bg-secondary');
        btn.textContent = "Загрузка...";
        btn.disabled = true;

        try {
            const ext = file.name.split('.').pop();
            const fName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const { error: sE } = await supabaseClient.storage.from('gallery_bucket').upload(fName, file);
            if(sE) throw sE;
            
            const { data } = supabaseClient.storage.from('gallery_bucket').getPublicUrl(fName);

            await supabaseClient.from('gallery').insert({
                user_id: this.user.tg_id,
                caption: desc,
                photo_url: data.publicUrl,
                is_moderated: false
            });

            document.getElementById('upload-modal').classList.add('hidden');
            document.getElementById('upload-desc').value = '';
            
            if(window.Telegram?.WebApp?.showPopup) {
                window.Telegram.WebApp.showPopup({message: "Фото отправлено на модерацию!"});
            } else {
                alert("Отправлено на модерацию");
            }
        } catch (e) {
            console.error(e);
            alert("Ошибка загрузки");
        } finally {
            btn.textContent = "Отправить на модерацию";
            btn.disabled = false;
            this.pendingUploadFile = null;
        }
    },

    async toggleLike(photo_id) {
        const el = document.getElementById(`like-icon-${photo_id}`);
        const countEl = document.getElementById(`like-count-${photo_id}`);
        const isLiked = el.style.fontVariationSettings.includes('1');
        const myId = this.user.tg_id;

        // Optimistically update UI first
        if(isLiked) {
            el.style.color = 'white';
            el.style.fontVariationSettings = "'FILL' 0";
        } else {
            el.style.color = '#ffb4ab';
            el.style.fontVariationSettings = "'FILL' 1";
            el.style.transform = 'scale(1.3)';
            setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
        }

        // Read current likes array from DB
        const { data: row } = await supabaseClient.from('gallery').select('likes').eq('id', photo_id).single();
        let currentLikes = Array.isArray(row?.likes) ? [...row.likes] : [];

        if(isLiked) {
            currentLikes = currentLikes.filter(id => id !== myId);
        } else {
            if(!currentLikes.includes(myId)) currentLikes.push(myId);
        }

        await supabaseClient.from('gallery').update({ likes: currentLikes }).eq('id', photo_id);

        // Update counter
        if(countEl) countEl.textContent = currentLikes.length > 0 ? currentLikes.length : '';
    },

    async saveBookmark(photo_id) {
        let el = document.getElementById(`bm-icon-${photo_id}`);
        if(el) {
            el.classList.add('text-secondary', 'fill-icon');
            el.classList.remove('text-white');
            el.style.fontVariationSettings = "'FILL' 1";
        }
        await supabaseClient.from('bookmarks').insert({ user_id: this.user.tg_id, photo_id: photo_id });
        if(window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        } else {
            alert("Добавлено в закладки!");
        }
    },

    openBookmarks() {
        const modal = document.getElementById('bookmarks-modal');
        modal.classList.remove('hidden');
        void modal.offsetWidth; // force reflow
        modal.classList.remove('translate-x-full');
        this.loadBookmarks();
    },

    closeBookmarks() {
        const modal = document.getElementById('bookmarks-modal');
        modal.classList.add('translate-x-full');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    openPhotoViewer(url) {
        const modal = document.getElementById('photo-viewer-modal');
        document.getElementById('viewer-img').src = url;
        modal.classList.remove('hidden');
        modal.classList.remove('opacity-0');
    },

    closePhotoViewer() {
        const modal = document.getElementById('photo-viewer-modal');
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('viewer-img').src = '';
        }, 300);
    },

    async loadBookmarks() {
        const grid = document.getElementById('bookmarks-grid');
        grid.innerHTML = '<p>Загрузка...</p>';
        const { data } = await supabaseClient.from('bookmarks').select('gallery(*)').eq('user_id', this.user.tg_id);
        if(!data || data.length === 0) {
            grid.innerHTML = `<p class="col-span-2 text-center text-on-surface-variant pt-10">Нет закладок</p>`;
            return;
        }
        grid.innerHTML = '';
        data.forEach(bm => {
            if(!bm.gallery) return;
            const item = document.createElement('div');
            item.className = "w-full aspect-[3/4] rounded-xl overflow-hidden relative shadow-lg bg-surface-container active:scale-95 transition-transform cursor-pointer";
            item.onclick = () => this.openPhotoViewer(bm.gallery.photo_url);
            item.innerHTML = `
                <img src="${bm.gallery.photo_url}" class="w-full h-full object-cover" />
                <div class="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6 text-xs text-white truncate font-medium">
                    ${bm.gallery.caption || 'Летопись'}
                </div>
            `;
            grid.appendChild(item);
        });
    },

    // --- Admin Sub-Tab Navigation ---
    switchAdminTab(tabName) {
        // Скрыть все панели
        document.querySelectorAll('.admin-sub-panel').forEach(el => el.classList.add('hidden'));
        // Сбросить все кнопки
        document.querySelectorAll('.admin-sub-tab').forEach(btn => {
            btn.style.background = 'rgba(68,59,102,0.8)';
            btn.style.color = 'rgba(232,221,196,0.5)';
            btn.style.border = '1px solid rgba(201,162,39,0.1)';
        });
        // Показать выбранную панель
        const panel = document.getElementById(`admin-panel-${tabName}`);
        if (panel) panel.classList.remove('hidden');
        // Активировать кнопку
        const btn = document.getElementById(`admin-sub-btn-${tabName}`);
        if (btn) {
            btn.style.background = 'linear-gradient(135deg, #c9a227, #8a6b18)';
            btn.style.color = '#26233a';
            btn.style.border = 'none';
        }
        // Загрузить данные
        if (tabName === 'analytics') this.loadAnalytics();
        if (tabName === 'moderation') this.loadModerationFeed();
    },

    // --- Admin ---
    async loadAdminPanel() {
        this.switchAdminTab('manage');
        this.loadAdminPostsList();
    },

    async adminAddChronicle(e) {
        e.preventDefault();
        const t = document.getElementById('ac-title').value;
        const txt = document.getElementById('ac-text').value;
        const fileInput = document.getElementById('ac-img-file');
        const file = fileInput ? fileInput.files[0] : null;

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Публикация...`;

        try {
            let pubUrl = null;
            if(file) {
                const ext = file.name.split('.').pop();
                const fName = `chronicle_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error: sE } = await supabaseClient.storage.from('gallery_bucket').upload(fName, file);
                if(sE) throw sE;
                const { data } = supabaseClient.storage.from('gallery_bucket').getPublicUrl(fName);
                pubUrl = data.publicUrl;
            }

            await supabaseClient.from('posts').insert({
                author_id: this.user.tg_id,
                image_url: pubUrl || 'https://images.unsplash.com/photo-1590494056294-84d72023d6a2?auto=format&fit=crop&q=80&w=600',
                text_content: JSON.stringify({ title: t, content: txt })
            });

            alert('Запись опубликована!');
            e.target.reset();
            const label = document.getElementById('ac-file-label');
            if(label) { label.textContent = 'Выберите обложку'; label.classList.remove('text-secondary'); }
            this.loadChronicle();
            this.loadAdminPostsList();
        } catch(err) {
            alert("Ошибка публикации: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined text-base" data-icon="publish">publish</span> Опубликовать`;
        }
    },

    async adminAddQuiz(e) {
        e.preventDefault();
        const t = document.getElementById('aq-title').value;
        const qJson = document.getElementById('aq-options-json').value;
        const durationHours = parseInt(document.getElementById('aq-duration-hours').value) || 24;

        try {
            let qObj = JSON.parse(qJson);
            if(!Array.isArray(qObj)) qObj = [qObj];
            const endTimeIso = new Date(Date.now() + durationHours * 3600000).toISOString();
            
            await supabaseClient.from('quizzes').insert({
                title: t,
                questions: qObj,
                end_time: endTimeIso
            });
            alert('Квиз сохранен и уже запущен!');
            e.target.reset();
            this.loadQuizzes();
        } catch (err) {
            alert('Неверный формат JSON');
        }
    },

    // --- Admin: Posts List with Delete ---
    async loadAdminPostsList() {
        const dom = document.getElementById('admin-posts-list');
        if (!dom) return;
        dom.innerHTML = '<p class="text-center text-on-surface-variant text-sm py-4">Загрузка...</p>';
        const { data, error } = await supabaseClient.from('posts').select('*').order('created_at', { ascending: false });
        if (error || !data || data.length === 0) {
            dom.innerHTML = '<p class="text-center text-on-surface-variant text-sm py-4">Нет записей</p>';
            return;
        }
        dom.innerHTML = '';
        data.forEach(post => {
            let titleText = 'Запись';
            try {
                const parsed = JSON.parse(post.text_content);
                if (parsed.title) titleText = parsed.title;
            } catch(e) { titleText = post.text_content?.substring(0, 40) || 'Без заголовка'; }

            const createdAt = post.created_at ? new Date(post.created_at).toLocaleDateString('ru-RU') : '';
            const item = document.createElement('div');
            item.className = 'flex items-center gap-3 rounded-xl p-3';
            item.style.cssText = 'background:rgba(38,35,58,0.7);border:1px solid rgba(201,162,39,0.12);';
            item.innerHTML = `
                <div class="w-12 h-12 rounded-lg overflow-hidden shrink-0" style="background:#3e345e;">
                    <img src="${post.image_url || ''}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\"material-symbols-outlined\\" style=\\"color:rgba(201,162,39,0.3);display:block;text-align:center;line-height:3rem;\\">image</span>'" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate" style="color:#e8ddc4;">${titleText}</p>
                    <p class="text-xs" style="color:rgba(181,168,130,0.5);">${createdAt}</p>
                </div>
                <button onclick="app.deletePost('${post.id}', this)" class="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors active:scale-90" style="background:rgba(139,26,42,0.15);">
                    <span class="material-symbols-outlined text-lg" style="color:#c44a5a;" data-icon="delete">delete</span>
                </button>
            `;
            dom.appendChild(item);
        });
    },

    async deletePost(id, btn) {
        if (!confirm('Удалить эту запись летописи навсегда?')) return;
        btn.disabled = true;
        const { error } = await supabaseClient.from('posts').delete().eq('id', id);
        if (error) { alert('Ошибка удаления'); btn.disabled = false; return; }
        btn.closest('div.flex').remove();
        this.loadChronicle();
    },

    // --- Admin: Analytics ---
    async loadAnalytics() {
        // Fetch all stats in parallel
        const [usersRes, photosRes, quizzesRes, resultsRes] = await Promise.all([
            supabaseClient.from('users').select('created_at', { count: 'exact' }),
            supabaseClient.from('gallery').select('id', { count: 'exact' }).eq('is_moderated', true),
            supabaseClient.from('quizzes').select('id', { count: 'exact' }),
            supabaseClient.from('quiz_results').select('user_id, score, created_at, quiz_id', { count: 'exact' })
        ]);

        // Update stat cards
        document.getElementById('stat-total-users').textContent = usersRes.count ?? '—';
        document.getElementById('stat-total-photos').textContent = photosRes.count ?? '—';
        document.getElementById('stat-total-quizzes').textContent = quizzesRes.count ?? '—';
        document.getElementById('stat-total-results').textContent = resultsRes.count ?? '—';

        // Activity Chart (registrations per day for last 14 days)
        this.renderActivityChart(usersRes.data || []);

        // Overall Leaderboard
        this.renderOverallLeaderboard(resultsRes.data || []);

        // Per-quiz winners
        this.renderPerQuizWinners(resultsRes.data || []);
    },

    renderActivityChart(usersData) {
        const canvas = document.getElementById('activity-chart');
        if (!canvas) return;

        // Destroy previous chart if exists
        if (this._activityChart) { this._activityChart.destroy(); this._activityChart = null; }

        // Build last 14 days labels
        const days = [];
        const counts = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            days.push(d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
            counts[key] = 0;
        }

        usersData.forEach(u => {
            if (u.created_at) {
                const key = u.created_at.split('T')[0];
                if (counts[key] !== undefined) counts[key]++;
            }
        });

        const values = Object.values(counts);

        this._activityChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Регистрации',
                    data: values,
                    backgroundColor: 'rgba(201, 162, 39, 0.2)',
                    borderColor: '#c9a227',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#3b2f5c',
                        titleColor: '#c9a227',
                        bodyColor: '#e8ddc4',
                        borderColor: 'rgba(201,162,39,0.3)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: { ticks: { color: 'rgba(181,168,130,0.5)', font: { size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: 'rgba(181,168,130,0.5)', stepSize: 1 }, grid: { color: 'rgba(201,162,39,0.06)' }, beginAtZero: true }
                }
            }
        });
    },

    async renderOverallLeaderboard(resultsData) {
        const dom = document.getElementById('overall-leaderboard');
        if (!dom) return;

        // Aggregate scores per user
        const scoremap = {};
        resultsData.forEach(r => {
            scoremap[r.user_id] = (scoremap[r.user_id] || 0) + (r.score || 0);
        });

        if (Object.keys(scoremap).length === 0) {
            dom.innerHTML = '<p class="text-center text-on-surface-variant text-sm py-4">Нет данных</p>';
            return;
        }

        // Fetch user names
        const userIds = Object.keys(scoremap);
        const { data: usersData } = await supabaseClient.from('users').select('tg_id, full_name, class_info').in('tg_id', userIds);
        const userMap = {};
        if (usersData) usersData.forEach(u => { userMap[u.tg_id] = u; });

        // Sort by score desc
        const sorted = Object.entries(scoremap).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const medals = ['🥇', '🥈', '🥉'];

        dom.innerHTML = sorted.map(([uid, score], idx) => {
            const u = userMap[uid];
            const name = u?.full_name?.text || 'Участник';
            const cls = u?.class_info ? `${u.class_info.num}${u.class_info.letter}` : '';
            const medal = medals[idx] || `${idx + 1}.`;
            const isTop = idx < 3;
            return `
            <div class="flex items-center gap-3 p-3 rounded-xl" style="${isTop ? 'background:rgba(201,162,39,0.06);border:1px solid rgba(201,162,39,0.1);' : ''}">
                <span class="text-xl w-8 text-center shrink-0">${medal}</span>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold truncate" style="color:#e8ddc4;">${name}</p>
                    <p class="text-xs" style="color:rgba(181,168,130,0.5);">${cls ? `Класс ${cls}` : ''}</p>
                </div>
                <span class="font-bold text-sm shrink-0" style="color:#c9a227;font-family:'Cinzel',serif;">${score} очк.</span>
            </div>`;
        }).join('');
    },

    async renderPerQuizWinners(resultsData) {
        const dom = document.getElementById('per-quiz-winners');
        if (!dom) return;

        // Fetch quizzes
        const { data: quizzes } = await supabaseClient.from('quizzes').select('id, title');
        if (!quizzes || quizzes.length === 0) {
            dom.innerHTML = '<p class="text-center text-on-surface-variant text-sm py-4">Нет квизов</p>';
            return;
        }

        // Fetch user names
        const userIds = [...new Set(resultsData.map(r => r.user_id))];
        let userMap = {};
        if (userIds.length > 0) {
            const { data: usersData } = await supabaseClient.from('users').select('tg_id, full_name').in('tg_id', userIds);
            if (usersData) usersData.forEach(u => { userMap[u.tg_id] = u.full_name?.text || 'Участник'; });
        }

        const medals = ['🥇', '🥈', '🥉'];
        dom.innerHTML = '';

        quizzes.forEach(quiz => {
            const quizResults = resultsData.filter(r => r.quiz_id === quiz.id).sort((a, b) => b.score - a.score).slice(0, 3);
            if (quizResults.length === 0) return;

            const section = document.createElement('div');
            section.className = 'rounded-xl p-4';
            section.style.cssText = 'background:rgba(38,35,58,0.7);border:1px solid rgba(201,162,39,0.12);';
            section.innerHTML = `
                <h3 class="font-headline text-sm mb-3 pb-2" style="color:#c9a227;border-bottom:1px solid rgba(201,162,39,0.2);">${quiz.title}</h3>
                <div class="space-y-2">
                    ${quizResults.map((r, idx) => `
                    <div class="flex items-center gap-2">
                        <span class="text-base w-6 shrink-0">${medals[idx] || (idx+1)+'.  '}</span>
                        <span class="flex-1 text-sm truncate" style="color:#e8ddc4;">${userMap[r.user_id] || 'Участник'}</span>
                        <span class="font-bold text-xs shrink-0" style="color:#c9a227;font-family:'Cinzel',serif;">${r.score} очк.</span>
                    </div>`).join('')}
                </div>
            `;
            dom.appendChild(section);
        });

        if (dom.innerHTML === '') {
            dom.innerHTML = '<p class="text-center text-on-surface-variant text-sm py-4">Нет результатов</p>';
        }
    },

    // --- Admin: Moderation ---
    async loadModerationFeed() {
        const dom = document.getElementById('mod-feed');
        const countEl = document.getElementById('mod-count');
        if (!dom) return;
        dom.innerHTML = '<p class="text-on-surface-variant text-sm">Загрузка...</p>';

        const { data, error } = await supabaseClient.from('gallery').select('*').eq('is_moderated', false).order('created_at', { ascending: false });
        if (error) console.error("Moderation Load Error:", error);

        if (countEl) countEl.textContent = data ? `${data.length} ожидают проверки` : '0 ожидают';

        if (!data || data.length === 0) {
            dom.innerHTML = '<p class="text-on-surface-variant text-sm py-4 text-center">✅ Всё одобрено!</p>';
        } else {
            // Fetch user names
            const userIds = [...new Set(data.map(g => g.user_id))];
            const { data: usersData } = await supabaseClient.from('users').select('tg_id, full_name').in('tg_id', userIds);
            const userMap = {};
            if (usersData) usersData.forEach(u => { userMap[u.tg_id] = u.full_name?.text; });

            dom.innerHTML = '';
            data.forEach(item => {
                const userName = userMap[item.user_id] || 'Неизвестно';
                dom.innerHTML += `
                <div class="rounded-xl overflow-hidden" style="background:rgba(38,35,58,0.8);border:1px solid rgba(201,162,39,0.12);">
                    <div class="h-40 relative cursor-pointer" onclick="app.openPhotoViewer('${item.photo_url}')">
                        <img src="${item.photo_url}" class="w-full h-full object-cover"/>
                        <div class="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-medium" style="background:rgba(0,0,0,0.7);color:#e8ddc4;">@${userName}</div>
                        <div class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full" style="background:rgba(0,0,0,0.5);">
                            <span class="material-symbols-outlined text-white text-sm">fullscreen</span>
                        </div>
                    </div>
                    <div class="p-3">
                        <p class="text-xs mb-3 truncate" style="color:rgba(181,168,130,0.6);">&laquo;${item.caption || 'Без подписи'}&raquo;</p>
                        <div class="flex gap-2">
                            <button class="flex-1 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all" style="background:rgba(201,162,39,0.1);color:#c9a227;border:1px solid rgba(201,162,39,0.25);" onclick="app.modAction('${item.id}', 'approve')">
                                ✓ Одобрить
                            </button>
                            <button class="flex-1 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all" style="background:rgba(139,26,42,0.15);color:#c44a5a;border:1px solid rgba(196,74,90,0.2);" onclick="app.modAction('${item.id}', 'delete')">
                                ✕ Удалить
                            </button>
                        </div>
                    </div>
                </div>`;
            });
        }

        // Load approved photos section below
        this.loadApprovedFeed();
    },

    async loadApprovedFeed() {
        const dom = document.getElementById('approved-feed');
        const countEl = document.getElementById('approved-count');
        if (!dom) return;
        dom.innerHTML = '<p class="col-span-2 text-on-surface-variant text-sm">Загрузка...</p>';

        const { data, error } = await supabaseClient.from('gallery').select('*').eq('is_moderated', true).order('created_at', { ascending: false });
        if (error) { console.error(error); return; }
        if (countEl) countEl.textContent = `${data?.length || 0} фото в галерее`;
        if (!data || data.length === 0) {
            dom.innerHTML = '<p class="col-span-2 text-on-surface-variant text-sm py-4 text-center">Нет одобренных фото</p>';
            return;
        }
        dom.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'relative aspect-square rounded-xl overflow-hidden bg-surface-container group cursor-pointer';
            card.innerHTML = `
                <img src="${item.photo_url}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                    <span class="text-[10px] text-white truncate flex-1">${item.caption || ''}</span>
                    <button onclick="event.stopPropagation(); app.modAction('${item.id}', 'delete')" class="w-7 h-7 bg-error/80 flex items-center justify-center rounded-full shrink-0 active:scale-90">
                        <span class="material-symbols-outlined text-white text-sm">delete</span>
                    </button>
                </div>
                <div class="absolute inset-0" onclick="app.openPhotoViewer('${item.photo_url}')"></div>
            `;
            dom.appendChild(card);
        });
    },

    async modAction(id, action) {
        if(action === 'approve') {
            await supabaseClient.from('gallery').update({is_moderated: true}).eq('id', id);
        } else {
            if (!confirm('Удалить это фото?')) return;
            await supabaseClient.from('gallery').delete().eq('id', id);
        }
        this.loadModerationFeed();
    }
};

function removeLoader() {
    const l = document.getElementById('screen-loading');
    if(l) {
        l.style.opacity = '0';
        setTimeout(() => l.remove(), 500);
    }
}

// Override boot functions to remove loader
const originalBoot = app.bootMainApp.bind(app);
app.bootMainApp = function() {
    removeLoader();
    originalBoot();
}

const originalCheck = app.checkUser.bind(app);
app.checkUser = async function() {
    try {
        const uid = tg.initDataUnsafe?.user?.id;
        if(!uid) throw new Error("No user id, falling back to onboarding");
        const { data, error } = await supabaseClient.from('users').select('*').eq('tg_id', uid).single();
        if(data) {
            this.user = data;
            this.bootMainApp();
        } else {
            removeLoader();
            document.getElementById('screen-onboarding').style.display = 'flex';
        }
    } catch(e) {
        console.warn(e);
        removeLoader();
        document.getElementById('screen-onboarding').style.display = 'flex';
    }
}

if(document.readyState !== 'loading') {
    app.init();
} else {
    window.addEventListener('DOMContentLoaded', () => app.init());
}
