/** Runs before paint so dark mode and canvas color are correct on first frame. */
export const INITIAL_THEME_SCRIPT = `(function(){try{var d=document.documentElement,t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})();`;
