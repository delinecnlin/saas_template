import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useLayoutEffect, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Group } from 'react-konva';

const CANVAS_RATIOS = [
  { label: "9:16", width: 540, height: 960 },
  { label: "16:9", width: 960, height: 540 },
  { label: "1:1", width: 720, height: 720 }
];

const MATERIAL_TABS = [
  { key: 'background', label: '背景', icon: '🖼️' },
  { key: 'text', label: '文字', icon: 'T' },
  { key: 'sticker', label: '贴纸', icon: '⭐' },
  { key: 'video', label: '视频', icon: '▶️' },
  { key: 'music', label: '音乐', icon: '🎵' }
];

// mock 素材数据
const BACKGROUND_LIST = [
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', name: '城市夜景', tag: '推荐' },
  { url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80', name: '森林', tag: '自然' }
];
const BACKGROUND_TAGS = ['推荐', '纯色', '自定义', '全部', '自然', '城市', '舞台', '动漫', '清新', '商务', '历史', '其他'];
const TEXT_LIST = [
  { text: '你好，欢迎使用数字人编辑器！', fontSize: 32, color: '#2563eb' },
  { text: '自定义标题', fontSize: 40, color: '#eab308' }
];
const STICKER_LIST = [
  { url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png', name: '星星' },
  { url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png', name: '星星2' }
];
const VIDEO_LIST = [
  { url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumb: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217', name: '示例视频1', duration: '00:10' },
  { url: 'https://www.w3schools.com/html/movie.mp4', thumb: 'https://img.youtube.com/vi/YE7VzlLtp-4/0.jpg', name: '示例视频2', duration: '00:05' }
];
const MUSIC_LIST = [
  { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', name: '背景音乐1', duration: '03:24' },
  { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', name: '背景音乐2', duration: '02:10' }
];

function useImage(url) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    return () => setImage(null);
  }, [url]);
  return image;
}

import { useCallback } from 'react';

// 贴纸图片批量加载
function useStickerImages(stickers) {
  const [images, setImages] = useState([]);
  useEffect(() => {
    let isMounted = true;
    Promise.all(stickers.map(s => {
      return new Promise(resolve => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = s.url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    })).then(imgs => {
      if (isMounted) setImages(imgs);
    });
    return () => { isMounted = false; };
  }, [stickers]);
  return images;
}

// 视频缩略图批量加载
function useVideoThumbs(videos) {
  const [thumbs, setThumbs] = useState([]);
  useEffect(() => {
    let isMounted = true;
    Promise.all(videos.map(v => {
      return new Promise(resolve => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = v.thumb;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    })).then(imgs => {
      if (isMounted) setThumbs(imgs);
    });
    return () => { isMounted = false; };
  }, [videos]);
  return thumbs;
}

import dynamic from "next/dynamic";
const AvatarEditorPage = function AvatarEditorPageImpl() {
  const router = useRouter();
  const { workspaceSlug, avatarId } = router.query;
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canvasRatio, setCanvasRatio] = useState(CANVAS_RATIOS[0]);
  const [voiceScript, setVoiceScript] = useState('');
  const [selectedPosture, setSelectedPosture] = useState(null);
  const [imageProps, setImageProps] = useState(null);
  // 画布缩放比例
  const [canvasScale, setCanvasScale] = useState(1);

  // 画布容器高度自适应
  const canvasBoxRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(480);

  // 动态获取画布容器高度
  useLayoutEffect(() => {
    function updateHeight() {
      if (canvasBoxRef.current) {
        setContainerHeight(canvasBoxRef.current.clientHeight - 24); // 24为padding
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 加载 avatar 详情
  useEffect(() => {
    if (!avatarId) return;
    setLoading(true);
    fetch(`/api/xiaoice/avatars`, { method: 'GET' })
      .then(res => res.json())
      .then(list => {
        const found = Array.isArray(list) ? list.find(a => a.id === avatarId) : null;
        setAvatar(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [avatarId]);

  // 姿势图片
  const postureImage = useImage(selectedPosture?.previewPicture);

  // 画布自适应缩放
  const baseScale = containerHeight / canvasRatio.height;
  const displayScale = baseScale * canvasScale;
  const displayWidth = Math.round(canvasRatio.width * displayScale);
  const displayHeight = Math.round(canvasRatio.height * displayScale);

  // 画布图片属性
  useEffect(() => {
    if (postureImage) {
      setImageProps({
        x: canvasRatio.width / 2 - (postureImage.width || 200) / 4,
        y: canvasRatio.height / 2 - (postureImage.height || 400) / 4,
        width: (postureImage.width || 200) / 2,
        height: (postureImage.height || 400) / 2,
        scaleX: 1,
        scaleY: 1,
        draggable: true
      });
    }

export default dynamic(() => Promise.resolve(AvatarEditorPage), { ssr: false });
  }, [postureImage, canvasRatio]);

  // 居中素材
  const handleCenterImage = () => {
    if (postureImage && imageProps) {
      const imgW = imageProps.width * (imageProps.scaleX || 1);
      const imgH = imageProps.height * (imageProps.scaleY || 1);
      setImageProps({
        ...imageProps,
        x: (canvasRatio.width - imgW) / 2,
        y: (canvasRatio.height - imgH) / 2,
      });
    }
  };

  // 素材Tab
  const [materialTab, setMaterialTab] = useState('background');
  // 画布元素
  const [background, setBackground] = useState(null);
  const [texts, setTexts] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [music, setMusic] = useState(null);
  // 贴纸图片
  const stickerImages = useStickerImages(stickers);
  // 视频缩略图
  const videoThumbs = useVideoThumbs(videos);

  // 添加素材
  const handleAddBackground = (bg) => setBackground(bg.url);
  const handleAddText = (t) => setTexts(ts => [...ts, { ...t, x: 60, y: 60, draggable: true }]);
  const handleAddSticker = (s) => setStickers(ss => [...ss, { ...s, x: 100, y: 100, scale: 1, draggable: true }]);
  const handleAddVideo = (v) => setVideos(vs => [...vs, { ...v, x: 120, y: 120, width: 120, height: 80, draggable: true }]);
  const handleAddMusic = (m) => setMusic(m);

  // 背景图
  const backgroundImage = useImage(background);

  // 二级素材面板
  function renderMaterialPanel() {
    if (materialTab === 'background') {
      return (
        <div style={{ width: 260, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 18, marginLeft: 8, marginTop: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>背景素材</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {BACKGROUND_TAGS.map(tag => (
              <span key={tag} style={{
                padding: "3px 12px",
                borderRadius: 8,
                background: tag === "推荐" ? "#2563eb" : "#f3f4f6",
                color: tag === "推荐" ? "#fff" : "#222",
                fontSize: 13,
                fontWeight: tag === "推荐" ? 700 : 500,
                cursor: "pointer"
              }}>{tag}</span>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {BACKGROUND_LIST.map(bg => (
              <div key={bg.url} style={{ width: 72, cursor: "pointer" }} onClick={() => handleAddBackground(bg)}>
                <img src={bg.url} alt={bg.name} style={{ width: 72, height: 40, objectFit: "cover", borderRadius: 8, border: "2px solid #eee" }} />
                <div style={{ fontSize: 12, color: "#333", textAlign: "center", marginTop: 2 }}>{bg.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (materialTab === 'text') {
      return (
        <div style={{ width: 260, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 18, marginLeft: 8, marginTop: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>文字模板</div>
          {TEXT_LIST.map((t, i) => (
            <div key={i} style={{ marginBottom: 10, cursor: "pointer", background: "#f3f4f6", borderRadius: 6, padding: 8, textAlign: "center" }} onClick={() => handleAddText(t)}>
              <span style={{ color: t.color, fontWeight: 700, fontSize: 15 }}>{t.text}</span>
            </div>
          ))}
        </div>
      );
    }
    if (materialTab === 'sticker') {
      return (
        <div style={{ width: 260, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 18, marginLeft: 8, marginTop: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>贴纸</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {STICKER_LIST.map((s, i) => (
              <div key={i} style={{ width: 56, cursor: "pointer", textAlign: "center" }} onClick={() => handleAddSticker(s)}>
                <img src={s.url} alt={s.name} style={{ width: 48, height: 48, objectFit: "contain", background: "#f3f4f6", borderRadius: 8 }} />
                <div style={{ fontSize: 11, color: "#333" }}>{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (materialTab === 'video') {
      return (
        <div style={{ width: 260, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 18, marginLeft: 8, marginTop: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>视频素材</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {VIDEO_LIST.map((v, i) => (
              <div key={i} style={{ width: 90, cursor: "pointer", textAlign: "center" }} onClick={() => handleAddVideo(v)}>
                <img src={v.thumb} alt={v.name} style={{ width: 90, height: 50, objectFit: "cover", borderRadius: 8, border: "2px solid #eee" }} />
                <div style={{ fontSize: 12, color: "#333", textAlign: "center", marginTop: 2 }}>{v.name}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{v.duration}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (materialTab === 'music') {
      return (
        <div style={{ width: 260, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 18, marginLeft: 8, marginTop: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>音乐素材</div>
          {MUSIC_LIST.map((m, i) => (
            <div key={i} style={{ marginBottom: 10, cursor: "pointer", background: "#f3f4f6", borderRadius: 6, padding: 8, textAlign: "center" }} onClick={() => handleAddMusic(m)}>
              <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 15 }}>{m.name}</span>
              <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>{m.duration}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }

  if (loading) return <div className="p-8">加载中...</div>;
  if (!avatar) return <div className="p-8 text-red-500">未找到该数字人</div>;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 顶部操作栏 */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: "#f5f6fa" }}>
        <button onClick={() => router.back()} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 5, padding: "6px 14px", cursor: "pointer", marginRight: 12 }}>返回</button>
        <div style={{ flex: 1 }} />
        <div style={{ marginRight: 18 }}>
          <label style={{ fontWeight: 600, marginRight: 6 }}>画布比例：</label>
          <select value={canvasRatio.label} onChange={e => {
            const ratio = CANVAS_RATIOS.find(r => r.label === e.target.value) || CANVAS_RATIOS[0];
            setCanvasRatio(ratio);
          }}>
            {CANVAS_RATIOS.map(r => (
              <option key={r.label} value={r.label}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* 主体区域 */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* 左侧素材Tab + 二级面板 */}
        <aside style={{ width: 80 + 260, display: "flex", flexDirection: "row", alignItems: "flex-start", background: "none", minWidth: 340 }}>
          <div style={{ width: 80, background: "#2563eb", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, height: "100vh" }}>
            {MATERIAL_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setMaterialTab(tab.key)}
                style={{
                  width: 56,
                  height: 56,
                  marginBottom: 10,
                  borderRadius: 12,
                  border: "none",
                  background: materialTab === tab.key ? "#fff" : "rgba(255,255,255,0.12)",
                  color: materialTab === tab.key ? "#2563eb" : "#fff",
                  fontWeight: 700,
                  fontSize: 22,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: materialTab === tab.key ? "0 2px 8px #0002" : "none"
                }}
                title={tab.label}
              >
                <span style={{ fontSize: 26, marginBottom: 2 }}>{tab.icon}</span>
                <span style={{ fontSize: 13 }}>{tab.label}</span>
              </button>
            ))}
          </div>
          {/* 二级素材面板 */}
          {renderMaterialPanel()}
        </aside>
        {/* 画布区 */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", background: "#fafbfc", minWidth: 0 }}>
          <div
            ref={canvasBoxRef}
            style={{
              marginTop: 18,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 2px 12px #0001",
              padding: 12,
              height: "100%",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              minWidth: displayWidth + 40,
              overflow: "hidden"
            }}>
            {/* 悬浮操作按钮组 */}
            <div style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "flex",
              gap: 10,
              background: "rgba(255,255,255,0.85)",
              borderRadius: 20,
              boxShadow: "0 2px 8px #0002",
              padding: "4px 12px"
            }}>
              <button
                onClick={() => setCanvasScale(s => Math.max(0.2, s - 0.1))}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f1f5f9", fontSize: 20, cursor: "pointer" }}
                title="缩小"
              >-</button>
              <span style={{ minWidth: 40, textAlign: "center", lineHeight: "32px", fontWeight: 600 }}>{Math.round(displayScale * 100)}%</span>
              <button
                onClick={() => setCanvasScale(s => Math.min(2, s + 0.1))}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f1f5f9", fontSize: 20, cursor: "pointer" }}
                title="放大"
              >+</button>
              <button
                onClick={handleCenterImage}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f1f5f9", fontSize: 18, cursor: "pointer" }}
                title="居中"
              >⎯</button>
            </div>
            <Stage
              width={canvasRatio.width}
              height={canvasRatio.height}
              scale={{ x: displayScale, y: displayScale }}
              style={{
                background: "#fff",
                borderRadius: 10,
                width: displayWidth,
                height: displayHeight,
                display: "block"
              }}
            >
              <Layer>
                {/* 背景图 */}
                {backgroundImage && (
                  <KonvaImage
                    image={backgroundImage}
                    x={0}
                    y={0}
                    width={canvasRatio.width}
                    height={canvasRatio.height}
                    listening={false}
                  />
                )}
                {/* 文字 */}
                {texts.map((t, i) => (
                  <KonvaText
                    key={i}
                    text={t.text}
                    x={t.x}
                    y={t.y}
                    fontSize={t.fontSize}
                    fill={t.color}
                    draggable={t.draggable}
                    onDragEnd={e => {
                      const newTexts = texts.slice();
                      newTexts[i] = { ...newTexts[i], x: e.target.x(), y: e.target.y() };
                      setTexts(newTexts);
                    }}
                  />
                ))}
                {/* 贴纸 */}
                {stickers.map((s, i) => (
                  stickerImages[i] &&
                  <Group
                    key={i}
                    x={s.x}
                    y={s.y}
                    draggable={s.draggable}
                    onDragEnd={e => {
                      const newStickers = stickers.slice();
                      newStickers[i] = { ...newStickers[i], x: e.target.x(), y: e.target.y() };
                      setStickers(newStickers);
                    }}
                  >
                    <KonvaImage
                      image={stickerImages[i]}
                      width={48}
                      height={48}
                    />
                  </Group>
                ))}
                {/* 视频缩略图 */}
                {videos.map((v, i) => (
                  videoThumbs[i] &&
                  <Group
                    key={i}
                    x={v.x}
                    y={v.y}
                    draggable={v.draggable}
                    onDragEnd={e => {
                      const newVideos = videos.slice();
                      newVideos[i] = { ...newVideos[i], x: e.target.x(), y: e.target.y() };
                      setVideos(newVideos);
                    }}
                  >
                    <KonvaImage
                      image={videoThumbs[i]}
                      width={v.width}
                      height={v.height}
                    />
                    <KonvaText
                      text="▶"
                      x={v.width / 2 - 12}
                      y={v.height / 2 - 12}
                      fontSize={24}
                      fill="#fff"
                      fontStyle="bold"
                      shadowColor="#000"
                      shadowBlur={4}
                      shadowOffset={{ x: 1, y: 1 }}
                    />
                  </Group>
                ))}
                {/* 姿势图片 */}
                {postureImage && imageProps && (
                  <KonvaImage
                    image={postureImage}
                    {...imageProps}
                    onDragEnd={e => setImageProps({ ...imageProps, x: e.target.x(), y: e.target.y() })}
                    onTransformEnd={e => {
                      const node = e.target;
                      setImageProps({
                        ...imageProps,
                        x: node.x(),
                        y: node.y(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY(),
                        rotation: node.rotation()
                      });
                    }}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </main>
        {/* 右侧：姿势选择 */}
        <aside style={{ width: 200, background: "#fff", borderLeft: "1px solid #eee", padding: 16, overflowY: "auto" }}>
          <h3 style={{ fontSize: 16, margin: "0 0 12px 0" }}>姿势选择</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {avatar.postureInfos && avatar.postureInfos.length > 0 ? (
              avatar.postureInfos.map(p => (
                <div key={p.bizId} style={{ cursor: "pointer", textAlign: "center", border: selectedPosture?.bizId === p.bizId ? "2px solid #2563eb" : "1px solid #eee", borderRadius: 8, padding: 2 }} onClick={() => setSelectedPosture(p)}>
                  <img src={p.previewPicture} alt={p.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />
                  <div style={{ fontSize: 12, marginTop: 2 }}>{p.name}</div>
                </div>
              ))
            ) : (
              <span style={{ color: "#888" }}>无可用姿势</span>
            )}
          </div>
        </aside>
      </div>
      {/* 底部操作栏 + 音乐播放条 */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 32px", borderTop: "1px solid #eee", background: "#fafbfc", position: "relative" }}>
        <div style={{ flex: 1, marginRight: 24 }}>
          <label style={{ fontWeight: 600, marginBottom: 4, display: "block" }}>口播文本：</label>
          <textarea
            value={voiceScript || ""}
            onChange={e => setVoiceScript(e.target.value)}
            placeholder="请输入口播文本，将与画布一起生成"
            style={{ width: "100%", minHeight: 48, borderRadius: 6, border: "1px solid #ccc", padding: 8, fontSize: 15 }}
          />
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <button
            onClick={() => alert("草稿保存功能待实现")}
            style={{ padding: "8px 22px", background: "#64748b", color: "#fff", border: "none", borderRadius: 5, fontSize: 16, cursor: "pointer" }}
          >暂存草稿</button>
          <button
            onClick={() => alert("预览功能待完善")}
            style={{ padding: "8px 22px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 5, fontSize: 16, cursor: "pointer" }}
          >预览</button>
          <button
            onClick={() => alert("最终生成功能待实现")}
            style={{ padding: "8px 22px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 5, fontSize: 16, cursor: "pointer" }}
          >最终生成</button>
        </div>
        {/* 音乐播放条 */}
        {music && (
          <div style={{
            position: "absolute",
            left: "50%",
            bottom: 8,
            transform: "translateX(-50%)",
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px #0002",
            padding: "6px 18px",
            display: "flex",
            alignItems: "center",
            minWidth: 260,
            zIndex: 20
          }}>
            <audio src={music.url} controls style={{ verticalAlign: "middle" }} />
            <span style={{ marginLeft: 12, fontWeight: 600 }}>{music.name}</span>
            <span style={{ marginLeft: 8, color: "#888", fontSize: 13 }}>{music.duration}</span>
            <button onClick={() => setMusic(null)} style={{ marginLeft: 16, background: "none", border: "none", color: "#888", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
