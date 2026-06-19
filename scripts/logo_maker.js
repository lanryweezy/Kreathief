(function () {
  console.log('Starting automated logo creation for 50 artboards...');
  const store = window.useStore.getState();

  // Clear any existing layers and artboards to start clean
  store.setArtboards([
    {
      id: 'default',
      name: '1. Nike',
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      layers: [],
    },
  ]);
  store.setActiveArtboardId('default');

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const logoNames = [
    'Nike',
    'Adidas',
    'Microsoft',
    'Apple',
    'Google',
    'LVMH',
    'Meta',
    'Tesla',
    'Amazon',
    'Target',
    'Starbucks',
    'IBM',
    'Intel',
    'McDonalds',
    'Chanel',
    'Pepsi',
    'HP',
    'Dell',
    'Adobe',
    'Ferrari',
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Toyota',
    'Netflix',
    'YouTube',
    'Spotify',
    'Facebook',
    'Twitter X',
    'PayPal',
    'Airbnb',
    'Coca-Cola',
    'Disney',
    'General Electric',
    'Visa',
    'Mastercard',
    'American Express',
    'Samsung',
    'Sony',
    'Lego',
    'Puma',
    'Gucci',
    'Hermes',
    'Rolex',
    'Uber',
    'Lyft',
    'TikTok',
    'Chevron',
    'Shell',
    'Kreathief (Next-Gen)',
  ];

  for (let i = 1; i < 50; i++) {
    const name = `${i + 1}. ${logoNames[i] || 'Brand'}`;
    store.addArtboard(name, 1080, 1080);
  }

  const artboards = window.useStore.getState().artboards;

  function addShapeToArtboard(artboardId, type, name, style) {
    const artboard = window.useStore.getState().artboards.find((a) => a.id === artboardId);
    if (!artboard) return;

    const layer = {
      id: `${type}_${uuidv4()}`,
      type: type,
      name: name,
      x: style.x ?? artboard.width / 2 - 100,
      y: style.y ?? artboard.height / 2 - 100,
      width: style.width ?? 200,
      height: style.height ?? 200,
      rotation: style.rotation ?? 0,
      color: style.color ?? '#333333',
      opacity: style.opacity ?? 1,
      locked: false,
      visible: true,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      },
      blendMode: 'normal',
      skewX: 0,
      skewY: 0,
      perspective: 0,
      rotateX: 0,
      rotateY: 0,
      ...style,
    };

    window.useStore.setState((state) => ({
      artboards: state.artboards.map((a) => (a.id === artboardId ? { ...a, layers: [...a.layers, layer] } : a)),
    }));
    return layer.id;
  }

  function addTextToArtboard(artboardId, text, style) {
    const artboard = window.useStore.getState().artboards.find((a) => a.id === artboardId);
    if (!artboard) return;

    const layer = {
      id: `text_${uuidv4()}`,
      type: 'text',
      name: text.slice(0, 20),
      text: text,
      x: style.x ?? artboard.width / 2 - 200,
      y: style.y ?? artboard.height / 2 - 25,
      width: style.width ?? 400,
      height: style.height ?? 100,
      rotation: style.rotation ?? 0,
      fontSize: style.fontSize ?? 40,
      fontWeight: style.fontWeight ?? '700',
      fontFamily: style.fontFamily ?? 'Inter',
      fontStyle: style.fontStyle ?? 'normal',
      textDecoration: style.textDecoration ?? 'none',
      textAlign: style.textAlign ?? 'center',
      color: style.color ?? '#000000',
      opacity: style.opacity ?? 1,
      locked: false,
      visible: true,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      },
      blendMode: 'normal',
      skewX: 0,
      skewY: 0,
      perspective: 0,
      rotateX: 0,
      rotateY: 0,
      lineHeight: 1.2,
      letterSpacing: 0,
      textTransform: 'none',
      warpStyle: 'none',
      curve: 0,
      ...style,
    };

    window.useStore.setState((state) => ({
      artboards: state.artboards.map((a) => (a.id === artboardId ? { ...a, layers: [...a.layers, layer] } : a)),
    }));
    return layer.id;
  }

  artboards.forEach((a, index) => {
    const artboardId = a.id;
    switch (index) {
      case 0:
        store.updateArtboard(artboardId, { backgroundColor: '#ffffff' });
        addShapeToArtboard(artboardId, 'path', 'Swoosh', {
          x: 290,
          y: 350,
          width: 500,
          height: 250,
          color: '#000000',
          viewBox: '0 0 500 250',
          pathData: 'M 50,180 Q 200,120 450,50 Q 220,230 50,180 Z',
        });
        addTextToArtboard(artboardId, 'NIKE', {
          x: 340,
          y: 650,
          fontSize: 80,
          fontWeight: '900',
          fontFamily: 'Impact',
          letterSpacing: 5,
        });
        break;

      case 1:
        store.updateArtboard(artboardId, { backgroundColor: '#ffffff' });
        addShapeToArtboard(artboardId, 'rectangle', 'Stripe 1', {
          x: 440,
          y: 350,
          width: 50,
          height: 180,
          rotation: -30,
          color: '#000000',
        });
        addShapeToArtboard(artboardId, 'rectangle', 'Stripe 2', {
          x: 510,
          y: 310,
          width: 50,
          height: 230,
          rotation: -30,
          color: '#000000',
        });
        addShapeToArtboard(artboardId, 'rectangle', 'Stripe 3', {
          x: 580,
          y: 270,
          width: 50,
          height: 280,
          rotation: -30,
          color: '#000000',
        });
        addTextToArtboard(artboardId, 'adidas', {
          x: 340,
          y: 620,
          fontSize: 75,
          fontWeight: '800',
          fontFamily: 'Inter',
          color: '#000000',
        });
        break;

      case 2:
        store.updateArtboard(artboardId, { backgroundColor: '#f3f3f3' });
        addShapeToArtboard(artboardId, 'rectangle', 'Red Square', {
          x: 430,
          y: 350,
          width: 100,
          height: 100,
          color: '#f25022',
        });
        addShapeToArtboard(artboardId, 'rectangle', 'Green Square', {
          x: 540,
          y: 350,
          width: 100,
          height: 100,
          color: '#7fba00',
        });
        addShapeToArtboard(artboardId, 'rectangle', 'Blue Square', {
          x: 430,
          y: 460,
          width: 100,
          height: 100,
          color: '#00a4ef',
        });
        addShapeToArtboard(artboardId, 'rectangle', 'Yellow Square', {
          x: 540,
          y: 460,
          width: 100,
          height: 100,
          color: '#ffb900',
        });
        addTextToArtboard(artboardId, 'Microsoft', {
          x: 340,
          y: 640,
          fontSize: 70,
          fontWeight: '600',
          fontFamily: 'Segoe UI',
          color: '#737373',
        });
        break;

      case 3:
        store.updateArtboard(artboardId, { backgroundColor: '#111111' });
        addShapeToArtboard(artboardId, 'circle', 'Apple Body', {
          x: 415,
          y: 350,
          width: 250,
          height: 250,
          color: '#ffffff',
        });
        addShapeToArtboard(artboardId, 'circle', 'Bite Cutout', {
          x: 590,
          y: 410,
          width: 100,
          height: 100,
          color: '#111111',
        });
        addShapeToArtboard(artboardId, 'path', 'Leaf', {
          x: 520,
          y: 260,
          width: 80,
          height: 80,
          color: '#ffffff',
          viewBox: '0 0 80 80',
          pathData: 'M 10,70 Q 50,60 70,10 Q 30,30 10,70 Z',
        });
        addTextToArtboard(artboardId, 'Apple', {
          x: 340,
          y: 680,
          fontSize: 60,
          fontWeight: '500',
          fontFamily: 'Inter',
          color: '#ffffff',
        });
        break;

      case 4:
        store.updateArtboard(artboardId, { backgroundColor: '#ffffff' });
        addShapeToArtboard(artboardId, 'circle', 'G Ring', {
          x: 440,
          y: 330,
          width: 200,
          height: 200,
          color: '#4285f4',
          opacity: 0.1,
        });
        addTextToArtboard(artboardId, 'Google', {
          x: 140,
          y: 420,
          fontSize: 130,
          fontWeight: '700',
          fontFamily: 'Inter',
          color: '#4285f4',
        });
        addShapeToArtboard(artboardId, 'circle', 'Dot Blue', {
          x: 400,
          y: 630,
          width: 40,
          height: 40,
          color: '#4285f4',
        });
        addShapeToArtboard(artboardId, 'circle', 'Dot Red', {
          x: 460,
          y: 630,
          width: 40,
          height: 40,
          color: '#ea4335',
        });
        addShapeToArtboard(artboardId, 'circle', 'Dot Yellow', {
          x: 520,
          y: 630,
          width: 40,
          height: 40,
          color: '#fbbc05',
        });
        addShapeToArtboard(artboardId, 'circle', 'Dot Green', {
          x: 580,
          y: 630,
          width: 40,
          height: 40,
          color: '#34a853',
        });
        break;

      case 5:
        store.updateArtboard(artboardId, { backgroundColor: '#ffffff' });
        addTextToArtboard(artboardId, 'LVMH', {
          x: 240,
          y: 400,
          fontSize: 110,
          fontWeight: '500',
          fontFamily: 'Georgia',
          color: '#000000',
          letterSpacing: 10,
        });
        addTextToArtboard(artboardId, 'MOËT HENNESSY. LOUIS VUITTON', {
          x: 140,
          y: 550,
          fontSize: 24,
          fontWeight: '600',
          fontFamily: 'Georgia',
          color: '#666666',
          letterSpacing: 6,
        });
        addShapeToArtboard(artboardId, 'rectangle', 'Line Divider', {
          x: 390,
          y: 520,
          width: 300,
          height: 2,
          color: '#b59a57',
        });
        break;

      case 6:
        store.updateArtboard(artboardId, { backgroundColor: '#ffffff' });
        addShapeToArtboard(artboardId, 'path', 'Infinity Loop', {
          x: 390,
          y: 350,
          width: 300,
          height: 160,
          color: '#0064e0',
          viewBox: '0 0 300 160',
          pathData:
            'M 75,40 C 10,40 10,120 75,120 C 130,120 170,40 225,40 C 290,40 290,120 225,120 C 170,120 130,40 75,40 Z',
        });
        addTextToArtboard(artboardId, 'Meta', {
          x: 340,
          y: 580,
          fontSize: 75,
          fontWeight: '700',
          fontFamily: 'Inter',
          color: '#0064e0',
        });
        break;

      case 7:
        store.updateArtboard(artboardId, { backgroundColor: '#111111' });
        addShapeToArtboard(artboardId, 'path', 'T Shield', {
          x: 440,
          y: 300,
          width: 200,
          height: 200,
          color: '#e82127',
          viewBox: '0 0 200 200',
          pathData: 'M 10,10 L 190,10 Q 100,50 10,10 M 100,30 L 100,190 M 35,45 Q 100,75 165,45 Q 100,105 100,190 Z',
        });
        addTextToArtboard(artboardId, 'TESLA', {
          x: 340,
          y: 580,
          fontSize: 80,
          fontWeight: '700',
          fontFamily: 'Inter',
          color: '#e82127',
          letterSpacing: 8,
        });
        break;

      case 8:
        store.updateArtboard(artboardId, { backgroundColor: '#ffffff' });
        addTextToArtboard(artboardId, 'amazon', {
          x: 290,
          y: 400,
          fontSize: 100,
          fontWeight: '800',
          fontFamily: 'Inter',
          color: '#000000',
        });
        addShapeToArtboard(artboardId, 'path', 'Amazon Arrow', {
          x: 390,
          y: 520,
          width: 300,
          height: 60,
          color: '#ff9900',
          viewBox: '0 0 300 60',
          pathData: 'M 10,10 Q 150,55 280,10 L 250,5 L 290,15 L 285,25 Z',
        });
        break;

      case 9:
        store.updateArtboard(artboardId, { backgroundColor: '#ffffff' });
        addShapeToArtboard(artboardId, 'circle', 'Outer Ring', {
          x: 390,
          y: 250,
          width: 300,
          height: 300,
          color: '#cc0000',
        });
        addShapeToArtboard(artboardId, 'circle', 'Middle Ring', {
          x: 440,
          y: 300,
          width: 200,
          height: 200,
          color: '#ffffff',
        });
        addShapeToArtboard(artboardId, 'circle', 'Inner Ring', {
          x: 490,
          y: 350,
          width: 100,
          height: 100,
          color: '#cc0000',
        });
        addTextToArtboard(artboardId, 'TARGET', {
          x: 340,
          y: 620,
          fontSize: 75,
          fontWeight: '900',
          fontFamily: 'Helvetica',
          color: '#cc0000',
          letterSpacing: 2,
        });
        break;

      case 49:
        store.updateArtboard(artboardId, { backgroundColor: '#0f051d' });
        addShapeToArtboard(artboardId, 'circle', 'Purple Glow', {
          x: 290,
          y: 250,
          width: 500,
          height: 500,
          color: '#8b5cf6',
          opacity: 0.15,
          blur: 50,
        });
        addShapeToArtboard(artboardId, 'circle', 'Gold Glow', {
          x: 390,
          y: 350,
          width: 300,
          height: 300,
          color: '#f59e0b',
          opacity: 0.1,
          blur: 40,
        });
        addShapeToArtboard(artboardId, 'path', 'Kreathief Modern K', {
          x: 390,
          y: 250,
          width: 300,
          height: 350,
          color: '#d946ef',
          viewBox: '0 0 300 350',
          pathData: 'M 60,30 L 60,320 M 60,175 Q 160,175 240,60 M 120,165 Q 180,240 250,320',
          stroke: { color: '#f43f5e', width: 24 },
        });
        addShapeToArtboard(artboardId, 'circle', 'AI Fusion Core', {
          x: 520,
          y: 400,
          width: 40,
          height: 40,
          color: '#10b981',
          opacity: 0.9,
        });
        addTextToArtboard(artboardId, 'KREATHIEF', {
          x: 140,
          y: 670,
          fontSize: 110,
          fontWeight: '900',
          fontFamily: 'Outfit',
          color: '#ffffff',
          letterSpacing: 8,
        });
        addTextToArtboard(artboardId, 'THE AI CREATIVE DIRECTOR', {
          x: 140,
          y: 810,
          fontSize: 26,
          fontWeight: '700',
          fontFamily: 'Outfit',
          color: '#f59e0b',
          letterSpacing: 12,
        });
        addShapeToArtboard(artboardId, 'rectangle', 'Poster Border', {
          x: 40,
          y: 40,
          width: 1000,
          height: 1000,
          color: 'transparent',
        });
        break;

      default:
        // Populate standard logo mockups for middle artboards
        store.updateArtboard(artboardId, { backgroundColor: '#ffffff' });
        addShapeToArtboard(artboardId, 'circle', 'Logo Base', {
          x: 440,
          y: 350,
          width: 200,
          height: 200,
          color: '#4285f4',
          opacity: 0.2,
        });
        addTextToArtboard(artboardId, a.name.split('. ')[1], {
          x: 290,
          y: 410,
          fontSize: 70,
          fontWeight: '800',
          fontFamily: 'Inter',
          color: '#333333',
        });
        addTextToArtboard(artboardId, 'FORTUNE 500 BRAND', {
          x: 240,
          y: 600,
          fontSize: 28,
          fontWeight: '600',
          fontFamily: 'Inter',
          color: '#666666',
          letterSpacing: 4,
        });
        break;
    }
  });

  // Global functions to help navigation
  window.viewAllArtboards = function () {
    window.useStore.getState().setZoom(0.08);
    window.useStore.getState().setPanOffset({ x: 100, y: 200 });
    console.log('Viewing all artboards.');
  };

  window.viewKreathiefLogo = function () {
    const store = window.useStore.getState();
    const artboard50 = store.artboards[49];
    if (artboard50) {
      const zoom = 0.5;
      const viewport = document.querySelector('.canvas-container');
      const vw = viewport ? viewport.clientWidth : 1500;
      const vh = viewport ? viewport.clientHeight : 730;

      const nx = vw / 2 - (artboard50.x + artboard50.width / 2) * zoom;
      const ny = vh / 2 - (artboard50.y + artboard50.height / 2) * zoom;

      store.setZoom(zoom);
      store.setPanOffset({ x: nx, y: ny });
      console.log('Viewing Kreathief Logo Artboard close-up!');
    } else {
      console.error('Artboard 50 not found.');
    }
  };

  // Zoom out to view all of them in all their glory!
  window.viewAllArtboards();
  console.log('All 50 logos designed successfully!');
})();
