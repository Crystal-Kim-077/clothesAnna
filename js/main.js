/**
 * 안나앤모드 공통 스크립트
 * - GNB / 마이페이지 개별 드롭다운
 * - 메인 슬라이드 (양방향, 2초 자동 전환, 무한 반복)
 * - 카드형 슬라이드 (라인 프로그레스바, 분류 탭)
 * - 시즌 코디 페이지 슬라이드 (숫자 인디게이터)
 * - 퀵 버튼 (최근 본 상품 / TOP)
 */
(function () {
  'use strict';

  var GAP = 40;

  /** 개별 슬라이드다운: mouseenter 시 열고 mouseleave 시 닫기 */
  function initDropdown(selector) {
    document.querySelectorAll(selector).forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        item.classList.add('is-open');
      });
      item.addEventListener('mouseleave', function () {
        item.classList.remove('is-open');
      });
    });
  }

  /** 메인 슬라이드: 앞뒤 복제본을 두어 끊김 없이 반복 */
  function initMainSlide() {
    var slider = document.querySelector('.main_slide');
    if (!slider) return;

    var track = slider.querySelector('.ms_track');
    var items = track.querySelectorAll('.ms_item');
    var total = items.length;
    var current = slider.querySelector('.ms_current');
    var index = 1;
    var isMoving = false;
    var timer;

    slider.querySelector('.ms_total').textContent = total;
    track.appendChild(items[0].cloneNode(true));
    track.insertBefore(items[total - 1].cloneNode(true), items[0]);

    function realIndex() {
      if (index === 0) return total - 1;
      if (index === total + 1) return 0;
      return index - 1;
    }

    function render(useTransition) {
      track.style.transition = useTransition ? 'transform .6s ease' : 'none';
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      var real = realIndex();
      current.textContent = real + 1;
      slider.classList.toggle('is-light', items[real].classList.contains('ms_item--light'));
    }

    function move(step) {
      if (isMoving) return;
      isMoving = true;
      index += step;
      render(true);
    }

    track.addEventListener('transitionend', function () {
      if (index === 0) index = total;
      if (index === total + 1) index = 1;
      render(false);
      isMoving = false;
    });

    function startAuto() {
      clearInterval(timer);
      timer = setInterval(function () { move(1); }, 2000);
    }

    slider.querySelector('.ms_prev').addEventListener('click', function () {
      move(-1);
      startAuto();
    });
    slider.querySelector('.ms_next').addEventListener('click', function () {
      move(1);
      startAuto();
    });

    render(false);
    startAuto();
  }

  /** 카드형 슬라이드: 1칸씩 이동 + 라인 프로그레스바 */
  function initCardSlider(slider) {
    var track = slider.querySelector('.cs_track');
    var viewport = slider.querySelector('.cs_viewport');
    var prev = slider.querySelector('.cs_prev');
    var next = slider.querySelector('.cs_next');
    var bar = slider.querySelector('.cs_bar');
    var index = 0;

    function visibleItems() {
      return Array.prototype.filter.call(track.children, function (li) {
        return li.style.display !== 'none';
      });
    }

    function update() {
      var items = visibleItems();
      var len = items.length;
      slider.classList.toggle('is-empty', len === 0);
      if (!len) return;

      var step = items[0].offsetWidth + GAP;
      var perView = Math.max(1, Math.floor((viewport.offsetWidth + GAP) / step));
      var max = Math.max(0, len - perView);
      index = Math.min(Math.max(index, 0), max);

      track.style.transform = 'translateX(' + (-index * step) + 'px)';
      bar.style.width = (Math.min(1, perView / len) * 100) + '%';
      bar.style.left = (index / len * 100) + '%';
      prev.classList.toggle('is-disabled', index === 0);
      next.classList.toggle('is-disabled', index === max);
    }

    slider.addEventListener('mouseenter', function () {
      slider.classList.add('is-hover');
    });
    slider.addEventListener('mouseleave', function () {
      slider.classList.remove('is-hover');
    });
    prev.addEventListener('click', function () { index -= 1; update(); });
    next.addEventListener('click', function () { index += 1; update(); });

    slider.resetSlider = function () { index = 0; update(); };
    update();
  }

  /** 분류 탭: data-cate 로 상품 필터링 */
  function initTabs(section) {
    var slider = section.querySelector('.card_slider');
    var buttons = section.querySelectorAll('.tab_btn');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cate = btn.dataset.cate;
        buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        slider.querySelectorAll('.card').forEach(function (card) {
          card.style.display = (cate === 'ALL' || card.dataset.cate === cate) ? '' : 'none';
        });
        slider.resetSlider();
      });
    });
  }

  /** 시즌 코디: 한 화면(2개) 단위로 이동 + 숫자 인디게이터 */
  function initPageSlider(slider) {
    var track = slider.querySelector('.cs_track');
    var cards = track.children;
    var perView = Number(slider.dataset.visible) || 2;
    var pages = Math.ceil(cards.length / perView);
    var page = 0;

    slider.querySelector('.ps_total').textContent = pages;

    function update() {
      var step = cards[0].offsetWidth + GAP;
      track.style.transform = 'translateX(' + (-page * perView * step) + 'px)';
      slider.querySelector('.ps_current').textContent = page + 1;
    }

    slider.querySelector('.cs_prev').addEventListener('click', function () {
      page = (page - 1 + pages) % pages;
      update();
    });
    slider.querySelector('.cs_next').addEventListener('click', function () {
      page = (page + 1) % pages;
      update();
    });

    update();
  }

  /** 최근 본 상품 저장/표시 (브라우저 저장소 사용, 실패해도 동작) */
  var RECENT_KEY = 'annanmode_recent';

  function readRecent() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveRecent(product) {
    var list = readRecent().filter(function (p) { return p.name !== product.name; });
    list.unshift(product);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
    } catch (e) { /* 저장 불가 환경은 무시 */ }
  }

  function renderRecent(listEl) {
    var list = readRecent();
    listEl.innerHTML = '';
    if (!list.length) {
      listEl.innerHTML = '<li class="recent_empty">최근 본 상품이 없습니다.</li>';
      return;
    }
    list.forEach(function (p) {
      var li = document.createElement('li');
      var img = document.createElement('img');
      var name = document.createElement('p');
      img.src = p.img;
      img.alt = '';
      name.textContent = p.name;
      li.appendChild(img);
      li.appendChild(name);
      listEl.appendChild(li);
    });
  }

  /** 퀵 버튼: 화면에 고정, 푸터가 보이면 푸터 위로 밀어 올림 */
  function initQuick() {
    var quick = document.querySelector('.quick');
    if (!quick) return;

    var footer = document.querySelector('.footer');
    var panel = quick.querySelector('.recent_panel');
    var listEl = quick.querySelector('.recent_list');

    function placeAboveFooter() {
      var overlap = window.innerHeight - footer.getBoundingClientRect().top;
      quick.style.bottom = (overlap > 0 ? overlap + 20 : 40) + 'px';
    }

    quick.querySelector('.quick_recent').addEventListener('click', function () {
      renderRecent(listEl);
      panel.classList.toggle('is-open');
    });
    quick.querySelector('.quick_top').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('.card_link').forEach(function (link) {
      link.addEventListener('click', function () {
        saveRecent({
          img: link.querySelector('img').getAttribute('src'),
          name: link.querySelector('.card_name').textContent
        });
      });
    });

    window.addEventListener('scroll', placeAboveFooter);
    window.addEventListener('resize', placeAboveFooter);
    placeAboveFooter();
  }

  /** 로그인 폼: 빈 칸 확인 */
  function initLoginForm() {
    var form = document.querySelector('.login_form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var error = form.querySelector('.form_error');
      if (!form.userId.value.trim()) {
        error.textContent = '아이디를 입력해 주세요.';
        form.userId.focus();
        return;
      }
      if (!form.userPw.value.trim()) {
        error.textContent = '비밀번호를 입력해 주세요.';
        form.userPw.focus();
        return;
      }
      error.textContent = '';
      alert('로그인 기능은 준비 중입니다.');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDropdown('.gnb_item.has_sub');
    initDropdown('.util_my');
    initMainSlide();
    document.querySelectorAll('.card_slider').forEach(initCardSlider);
    document.querySelectorAll('.tab_section').forEach(initTabs);
    document.querySelectorAll('.page_slider').forEach(initPageSlider);
    initQuick();
    initLoginForm();
  });
})();
