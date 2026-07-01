(function(){
  const root = document.querySelector('[data-videos]');
  if(!root) return;

  const listEl = document.getElementById('videosList');
  const dataUrl = root.getAttribute('data-src') || '/assets/videos.json';

  function sortVideos(videos){
    return videos.slice().sort(function(a, b){
      return String(b.published || '').localeCompare(String(a.published || ''));
    });
  }

  function embedUrl(id){
    return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id);
  }

  function watchUrl(id){
    return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
  }

  function pad2(n){
    return String(n).padStart(2, '0');
  }

  function formatDate(iso){
    if(!iso) return '';
    const parts = iso.split('-');
    if(parts.length < 3) return iso;
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const m = months[Number(parts[1]) - 1] || parts[1];
    return m + ' ' + Number(parts[2]) + ', ' + parts[0];
  }

  function createCard(video, index){
    const article = document.createElement('article');
    article.className = 'streetlogEntry';

    const head = document.createElement('header');
    head.className = 'streetlogEntry__head';

    const num = document.createElement('span');
    num.className = 'streetlogEntry__index';
    num.textContent = pad2(index + 1);

    const titleWrap = document.createElement('div');
    titleWrap.className = 'streetlogEntry__titles';

    const title = document.createElement('h2');
    title.className = 'streetlogEntry__title';
    title.textContent = video.title;

    const date = document.createElement('time');
    date.className = 'streetlogEntry__date';
    date.dateTime = video.published || '';
    date.textContent = formatDate(video.published);

    titleWrap.appendChild(title);
    titleWrap.appendChild(date);
    head.appendChild(num);
    head.appendChild(titleWrap);

    const frame = document.createElement('div');
    frame.className = 'streetlogEntry__frame';

    const embed = document.createElement('div');
    embed.className = 'streetlogEntry__embed';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl(video.id);
    iframe.title = video.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    embed.appendChild(iframe);
    frame.appendChild(embed);

    const meta = document.createElement('div');
    meta.className = 'streetlogEntry__meta';

    const desc = document.createElement('p');
    desc.className = 'streetlogEntry__desc';
    desc.textContent = video.description || '';

    const link = document.createElement('a');
    link.className = 'streetlogEntry__link';
    link.href = watchUrl(video.id);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'open on youtube →';

    meta.appendChild(desc);
    meta.appendChild(link);

    article.appendChild(head);
    article.appendChild(frame);
    article.appendChild(meta);
    return article;
  }

  function injectSchema(videos){
    const graph = videos.map(function(video){
      return {
        '@type': 'VideoObject',
        'name': video.title,
        'description': video.description || video.title,
        'uploadDate': video.published,
        'embedUrl': embedUrl(video.id),
        'contentUrl': watchUrl(video.id),
        'thumbnailUrl': 'https://i.ytimg.com/vi/' + video.id + '/hqdefault.jpg'
      };
    });

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph
    });
    document.head.appendChild(script);
  }

  fetch(dataUrl)
    .then(function(res){
      if(!res.ok) throw new Error('Failed to load videos');
      return res.json();
    })
    .then(function(videos){
      const sorted = sortVideos(videos);
      sorted.forEach(function(video, i){
        listEl.appendChild(createCard(video, i));
      });
      injectSchema(sorted);
    })
    .catch(function(){
      if(listEl){
        listEl.innerHTML = '<p class="streetlogError">Unable to load entries.</p>';
      }
    });
})();
