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
        document.getElementById('btn-bookmarks').addEventListener('click', () => {
             document.getElementById('bookmarks-modal').classList.remove('hidden');
             this.loadBookmarks();
        });

        // Admin Forms
        document.getElementById('form-add-chronicle').addEventListener('submit', this.adminAddChronicle.bind(this));
        document.getElementById('form-add-quiz').addEventListener('submit', this.adminAddQuiz.bind(this));

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
        const name = document.getElementById('on-name').value;
        const cls = document.getElementById('on-class').value;
        const letter = document.getElementById('on-letter').value;
        const uid = tg.initDataUnsafe?.user?.id || Date.now();
        
        // Match user schema exactly
        const payload = {
            tg_id: uid,
            full_name: { text: name },
            class_info: { num: parseInt(cls), letter: letter },
            is_admin: false,
            is_banned_photo: false
        };

        const { error } = await supabaseClient.from('users').insert(payload);
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
                let nameStr = 'И'; // default
                if(this.user.full_name && this.user.full_name.text) {
                    nameStr = this.user.full_name.text.charAt(0).toUpperCase();
                }
                headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=003399&color=e9c400`;
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
        document.querySelectorAll('.nav-tab').forEach(el => {
            el.querySelector('.nav-icon').classList.remove('fill-icon');
            el.classList.remove('text-[#e9c400]', 'text-primary');
            el.classList.add('text-[#b5c4ff]/60');
            el.classList.remove('relative', 'after:content-[\'\']', 'after:w-1', 'after:h-1', 'after:bg-[#43e2d2]', 'after:rounded-full', 'after:mt-1', 'scale-110');
        });

        const activeEl = document.getElementById(`tab-btn-${tabName}`);
        if(activeEl) {
            activeEl.classList.add('text-[#e9c400]', 'relative', 'after:content-[\'\']', 'after:w-1', 'after:h-1', 'after:bg-[#43e2d2]', 'after:rounded-full', 'after:mt-1', 'scale-110');
            activeEl.classList.remove('text-[#b5c4ff]/60');
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
        feed.innerHTML = '<p class="text-center text-on-surface-variant">Загрузка летописи...</p>';
        const { data, error } = await supabaseClient.from('posts').select('*, users(full_name)').order('created_at', { ascending: false });
        if(error || !data) {
            feed.innerHTML = '<p class="text-center text-error">Ошибка загрузки</p>';
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

            const article = document.createElement('article');
            article.className = "bg-surface-container-low rounded-xl overflow-hidden shadow-2xl shadow-black/40 group";
            article.innerHTML = `
                <div class="relative h-64 overflow-hidden">
                    <img alt="Post cover" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="${post.image_url || 'https://images.unsplash.com/photo-1590494056294-84d72023d6a2?auto=format&fit=crop&q=80&w=600'}"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
                    <div class="absolute top-4 left-4 bg-tertiary/90 text-on-tertiary px-3 py-1 rounded-full text-xs font-bold font-manrope">Летопись</div>
                </div>
                <div class="p-6">
                    <h2 class="font-notoSerif text-2xl font-bold text-primary mb-3">${titleText}</h2>
                    <p class="font-notoSerif text-on-surface/90 leading-relaxed italic mb-6 shadow-text line-clamp-4">${contentText}</p>
                    <div class="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                        <button class="bg-primary-container/30 hover:bg-primary-container/50 text-secondary px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 border border-secondary/20 shadow-inner shadow-secondary/10" onclick="app.shareStory('${titleText.replace(/'/g, "\\'")}')">
                            <span class="material-symbols-outlined text-lg" data-icon="auto_awesome_motion">auto_awesome_motion</span>
                            <span class="text-xs font-manrope font-bold">Поделиться в Сторис</span>
                        </button>
                    </div>
                </div>
            `;
            feed.appendChild(article);
        });
    },

    shareStory(titleText) {
        const canvas = document.getElementById('story-canvas');
        const ctx = canvas.getContext('2d');
        const bgImg = new Image();
        bgImg.crossOrigin = "Anonymous";
        bgImg.src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1080&h=1920";
        bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, 1080, 1920);
            ctx.fillStyle = "rgba(11, 19, 38, 0.7)"; 
            ctx.fillRect(0, 0, 1080, 1920);
            ctx.fillStyle = "rgba(0, 51, 153, 0.5)"; 
            ctx.beginPath();
            ctx.roundRect(100, 600, 880, 400, 40);
            ctx.fill();

            ctx.font = "bold 64px serif";
            ctx.fillStyle = "#e9c400";
            ctx.textAlign = "center";
            ctx.fillText("Наследие Амира Темура", 540, 700);

            ctx.font = "italic 48px sans-serif";
            ctx.fillStyle = "#ffffff";
            
            const lines = this.getLines(ctx, titleText, 800);
            let y = 800;
            lines.forEach(line => {
                ctx.fillText(line, 540, y);
                y += 60;
            });

            ctx.font = "bold 32px sans-serif";
            ctx.fillStyle = "#43e2d2"; 
            ctx.fillText("@heritage_bot_twa", 540, 1800);

            const dataUrl = canvas.toDataURL("image/png");
            
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `story_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            if(window.Telegram?.WebApp?.showPopup) {
                window.Telegram.WebApp.showPopup({message: "Изображение сохранено!"});
            } else {
                alert("Изображение сохранено!");
            }
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
                <div class="bg-surface-container-lowest/50 rounded-xl p-6 border border-outline-variant/15 opacity-80">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="font-headline text-lg text-on-surface-variant">${quiz.title}</h4>
                        <span class="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded uppercase">Завершено</span>
                    </div>
                    <div class="bg-surface-container-low rounded-lg p-4 mb-4 flex items-center justify-around">
                        <div class="flex flex-col items-center">
                            <span class="text-xs text-on-surface-variant uppercase mb-1">Очки</span>
                            <span class="text-lg font-bold text-secondary">${p} pts</span>
                        </div>
                    </div>
                </div>`;
            } else {
                html = `
                <div class="group bg-surface-container-low rounded-xl p-6 border-l-4 border-secondary shadow-lg relative overflow-hidden">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <div class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Событие</div>
                            <h4 class="font-headline text-xl text-primary-fixed-dim">${quiz.title}</h4>
                        </div>
                        <span class="material-symbols-outlined text-tertiary" data-icon="stars" style="font-variation-settings: 'FILL' 1;">stars</span>
                    </div>
                    <button class="w-full bg-primary-container text-on-primary py-3 rounded-xl font-bold inner-glow flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all" onclick="app.openQuiz('${quiz.id}', ${hasResult})">
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
            this.currentQuiz = {
                data: quiz,
                questions: typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions,
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
            container.innerHTML = `<h3 class="text-xl text-center text-secondary mb-4">Завершено!</h3><p class="text-center">Вы ответили верно на ${c.score} из ${c.questions.length}. Очки будут начислены!</p>`;
            document.getElementById('qm-actions').innerHTML = `<button onclick="app.submitQuizScore()" class="bg-primary-container text-on-primary px-6 py-2 rounded-xl">Завершить</button>`;
            return;
        }

        let optsHtml = '';
        qData.options.forEach((opt, idx) => {
            optsHtml += `<button onclick="app.answerQuiz(${idx}, ${qData.correct})" class="w-full text-left bg-surface-container-lowest hover:bg-surface-variant p-4 rounded-xl mb-2 transition-colors border border-outline-variant/30">${opt}</button>`;
        });

        container.innerHTML = `
            <p class="text-[10px] text-tertiary mb-2 uppercase tracking-widest">Вопрос ${c.index + 1} из ${c.questions.length}</p>
            <h4 class="text-lg font-headline leading-tight mb-6">${qData.q}</h4>
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
        
        const { data, error } = await supabaseClient.from('gallery').select('*, users!inner(full_name)').eq('is_moderated', true).order('created_at', {ascending: false});
        if(error || !data || data.length === 0) {
            feed.innerHTML = '<p class="text-center text-white pt-24">Нет доступных материалов</p>';
            return;
        }

        data.forEach(item => {
            const userName = item.users.full_name && item.users.full_name.text ? item.users.full_name.text : 'резидент';
            const section = document.createElement('section');
            section.className = "relative h-screen w-full flex flex-col justify-end snap-start";
            section.innerHTML = `
                <img alt="Reel" class="absolute inset-0 w-full h-[100dvh] object-cover" src="${item.photo_url}"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                
                <div class="relative w-full px-6 pb-32 flex justify-between items-end">
                    <div class="max-w-[70%] mb-4">
                        <div class="flex items-center gap-3 mb-2">
                            <p class="font-label font-bold text-sm text-secondary">@${userName.replace(/\s+/g,'_').toLowerCase()}</p>
                        </div>
                        <h2 class="font-headline italic text-xl text-white leading-tight drop-shadow-lg">${item.caption || ''}</h2>
                    </div>
                    <div class="flex flex-col gap-6 items-center">
                        <button class="group flex flex-col items-center gap-1" onclick="app.toggleLike('${item.id}')">
                            <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform active:scale-125">
                                <span class="material-symbols-outlined text-white" id="like-icon-${item.id}" data-icon="favorite">favorite</span>
                            </div>
                        </button>
                        <button class="group flex flex-col items-center gap-1" onclick="app.saveBookmark('${item.id}')">
                            <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform active:scale-125">
                                <span class="material-symbols-outlined text-white" data-icon="bookmark_add">bookmark_add</span>
                            </div>
                        </button>
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
        let el = document.getElementById(`like-icon-${photo_id}`);
        if(el.classList.contains('text-tertiary')) {
            el.classList.remove('text-tertiary', 'fill-icon');
            el.classList.add('text-white');
            el.style.fontVariationSettings = "'FILL' 0";
            await supabaseClient.from('photo_likes').delete().eq('user_id', this.user.tg_id).eq('photo_id', photo_id);
        } else {
            el.classList.add('text-tertiary', 'fill-icon');
            el.classList.remove('text-white');
            el.style.fontVariationSettings = "'FILL' 1";
            await supabaseClient.from('photo_likes').insert({ user_id: this.user.tg_id, photo_id: photo_id });
        }
    },

    async saveBookmark(photo_id) {
        await supabaseClient.from('bookmarks').insert({ user_id: this.user.tg_id, photo_id: photo_id });
        if(window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        } else {
            alert("Добавлено в закладки!");
        }
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
            item.className = "w-full aspect-square rounded-xl overflow-hidden relative shadow bg-surface-container";
            item.innerHTML = `
                <img src="${bm.gallery.photo_url}" class="w-full h-full object-cover opacity-80" />
                <div class="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2 text-xs truncate">
                    ${bm.gallery.caption || ''}
                </div>
            `;
            grid.appendChild(item);
        });
    },

    // --- Admin ---
    async loadAdminPanel() {
        this.loadModerationFeed();
    },

    async adminAddChronicle(e) {
        e.preventDefault();
        const t = document.getElementById('ac-title').value;
        const txt = document.getElementById('ac-text').value;
        const img = document.getElementById('ac-img').value;

        await supabaseClient.from('posts').insert({
            author_id: this.user.tg_id,
            image_url: img || 'https://images.unsplash.com/photo-1590494056294-84d72023d6a2?auto=format&fit=crop&q=80&w=600',
            text_content: JSON.stringify({ title: t, content: txt })
        });
        alert('Запись опубликована!');
        e.target.reset();
    },

    async adminAddQuiz(e) {
        e.preventDefault();
        const t = document.getElementById('aq-title').value;
        const qJson = document.getElementById('aq-options-json').value;
        const end = document.getElementById('aq-endtime').value;

        try {
            JSON.parse(qJson);
            await supabaseClient.from('quizzes').insert({
                title: t,
                questions: qJson,
                end_time: new Date(end).toISOString()
            });
            alert('Квиз сохранен!');
            e.target.reset();
        } catch (err) {
            alert('Неверный формат JSON');
        }
    },

    async loadModerationFeed() {
        const dom = document.getElementById('mod-feed');
        dom.innerHTML = 'Загрузка...';
        const { data } = await supabaseClient.from('gallery').select('*, users!inner(full_name)').eq('is_moderated', false);
        document.getElementById('mod-count').textContent = data ? `${data.length} ожидают` : '0 ожидают';
        
        if(!data || data.length === 0) {
            dom.innerHTML = '<p class="text-on-surface-variant ml-2">Все чисто!</p>';
            return;
        }

        dom.innerHTML = '';
        data.forEach(item => {
            dom.innerHTML += `
            <div class="bg-surface-container-low rounded-xl overflow-hidden shadow-lg border border-outline-variant/10">
                <div class="h-40 relative">
                    <img src="${item.photo_url}" class="w-full h-full object-cover" />
                    <div class="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white">ID: ${item.id}</div>
                </div>
                <div class="p-4 flex flex-col gap-4">
                    <div class="flex justify-between items-start">
                        <span class="text-xs font-medium text-on-surface">${item.caption || ''}</span>
                    </div>
                <div class="flex gap-2">
                    <button class="flex-1 py-2 bg-secondary/20 text-secondary border border-secondary/30 rounded-lg text-xs font-bold hover:bg-secondary/30 transition-colors" onclick="app.modAction('${item.id}', 'approve')">Одобрить</button>
                    <button class="flex-1 py-2 bg-error/10 text-error border border-error/20 rounded-lg text-xs font-bold hover:bg-error/20 transition-colors" onclick="app.modAction('${item.id}', 'delete')">Удалить</button>
                </div>
                </div>
            </div>`;
        });
    },

    async modAction(id, action) {
        if(action === 'approve') {
            await supabaseClient.from('gallery').update({is_moderated: true}).eq('id', id);
        } else {
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
