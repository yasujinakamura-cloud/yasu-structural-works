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

  function createCard(video){
    const article = document.createElement('article');
    article.className = 'videoCard';

    const embed = document.createElement('div');
    embed.className = 'videoEmbed';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl(video.id);
    iframe.title = video.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    embed.appendChild(iframe);

    const meta = document.createElement('div');
    meta.className = 'videoMeta';

    const title = document.createElement('h2');
    title.className = 'videoTitle';
    title.textContent = video.title;

    const desc = document.createElement('p');
    desc.className = 'videoDesc';
    desc.textContent = video.description || '';

    const link = document.createElement('a');
    link.className = 'videoWatchLink';
    link.href = watchUrl(video.id);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'WATCH ON YOUTUBE →';

    meta.appendChild(title);
    if(video.description) meta.appendChild(desc);
    meta.appendChild(link);

    article.appendChild(embed);
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
      sorted.forEach(function(video){
        listEl.appendChild(createCard(video));
      });
      injectSchema(sorted);
    })
    .catch(function(){
      if(listEl){
        listEl.innerHTML = '<p class="videoError">Unable to load videos.</p>';
      }
    });
})();
