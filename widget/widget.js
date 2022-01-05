const widget = {

	config: {
		endpoint: 'https://app.buildfire.com/api/auth/user/apps',
		env: 'prod'
	},

	textContainer: document.getElementById('textContainer'),
	appContainer: document.getElementById('list'),
	scrollContainer: document.getElementById('scrollContainer'),
	emptyState: document.getElementById('empty-state'),
	scrollHandler: null,

	apps: [],
	busy: false,
	pageIndex: 0,
	pageSize: 10,
	done: false,

	text: `<div class="header">
					<h1 class="header__title">Your Designs</h1>
					<p class="header_subtitle body-text">You are reviewing your designs in draft mode. Some features will be disabled.</p>
				</div>`,

	init() {

		buildfire.datastore.get(this.loadData);
		buildfire.datastore.onUpdate(obj => this.loadData(null, obj), false);

		this.searchApps();

		buildfire.deeplink.getData(dld => {
			const { appId, env, appName } = dld || {};

			if (appId && env) {
				this.openApp({ appId, env, appName });
			}
		});
	},

	loadData(error, obj) {
		if (error) return console.error(error);
		if (obj && obj.data && typeof obj.data.text === 'string') {
			widget.text = obj.data.text;
		}

		widget.textContainer.innerHTML = widget.text;
	},

	searchApps() {
		if (this.busy) return;
		buildfire.spinner.show();
		this.busy = true;

		const options = {
			pageSize: this.pageSize,
			pageIndex: this.pageIndex,
			sort: { name: 1 },
		};

		const handleResponse = (error, { data }) => {
			buildfire.spinner.hide();
			if (error) return console.error(error);

			if (!data.length || data.length < this.pageSize) {
				this.done = true;
			}
			if (data.length === 1 && this.pageIndex === 0) {
				this.autoNavigate(data[0]);
				this.done = true;
			}
			this.renderApps(data);
			this.pageIndex += 1;
			this.busy = false;
		}
		this.search(options, handleResponse);
	},

	autoNavigate(app) {
		let timer = setTimeout(() => {
			this.openApp(app);
		}, 2000);
		const toastOptions = {
			message: `Navigating to ${app.name}... `,
			duration: 2 * 1000,
			type: 'primary',
			hideDismissButton: true,
			actionButton: {
				text: 'Cancel',
				action: () => {
					clearTimeout(timer);
				}
			}
		};
		buildfire.dialog.toast(toastOptions);
	},

	search(options, callback) {

		var xhr = new XMLHttpRequest();
		xhr.open("POST", this.config.endpoint);

		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				if (xhr.status === 200) {
					callback(null, JSON.parse(xhr.responseText));
				} else {
					callback(xhr.responseText, null);
				}
			}
		};

		xhr.addEventListener("error", function (error) {
			callback(error, null)
		});

		xhr.onerror = console.error;
		xhr.setRequestHeader("Content-Type", "application/json");

		buildfire.auth.getCurrentUser((err, { accessToken }) => {
			if (err) return console.error(err);
			xhr.send(JSON.stringify({ ...options, accessToken }));
		})
	},

	renderApps(apps) {
		this.apps = [ ...this.apps, ...apps];

		apps.forEach(app => this.appContainer.appendChild(this.renderCard(app)));

		if (this.scrollHandler) {
			this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
		}
		if (this.done) return;
		this.scrollHandler = () => {
			
			if (this.scrollContainer.scrollTop + this.scrollContainer.clientHeight + window.innerHeight >= this.scrollContainer.scrollHeight) {
				this.searchApps();
			}
		};
		this.scrollContainer.addEventListener('scroll', this.scrollHandler);
	},

	renderCard(app) {
		const { appId, name, appearance } = app;

		const card = document.createElement('div');
		card.classList.add('card');
		card.setAttribute('data-appId', appId);

		const imgHolder = document.createElement('div');
		imgHolder.classList.add('card__img--holder');

		const img = document.createElement('img');
		img.classList.add('card__img');

		const iconUrl = appearance.iconUrl ? buildfire.imageLib.cropImage(appearance.iconUrl, { size: 'xs', aspect: '1:1' }) : '../../../styles/media/holder-1x1.png';
		img.setAttribute('src', iconUrl);

		const title = document.createElement('h4');
		title.classList.add('card__title', 'body-text');
		title.innerHTML = name;

		card.appendChild(imgHolder);
		imgHolder.appendChild(img);
		card.appendChild(title);

		card.onclick = () => this.openApp(app);

		return card;
	},

	openApp(app) {
		if (buildfire.isWeb()) {
			const toastOptions = {
				message: 'App Preview not supported on web.',
				type: 'warning',
				duration: 5 * 1000
			};
			return buildfire.dialog.toast(toastOptions);
		}
		if (!app.env) app.env = this.config.env;
		buildfire.navigation.navigateEmulator(app);
	}
};

widget.init();
