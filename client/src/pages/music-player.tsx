import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { musicApi, type MusicSearchResult } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, SkipForward, Music2, Youtube, Clock } from "lucide-react";

type QueueItem = MusicSearchResult & { kind: "main" | "custom" };

export default function MusicPlayerPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searchSource] = useState<"youtube">("youtube");
  const [selectedResult, setSelectedResult] = useState<MusicSearchResult | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Custom songs / interval logic
  const [customTitle, setCustomTitle] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customTracks, setCustomTracks] = useState<QueueItem[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState(180);
  const [lastCustomPlayedAt, setLastCustomPlayedAt] = useState<number | null>(null);
  const [isPlayingCustom, setIsPlayingCustom] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["music-search", query, searchSource],
    queryFn: () => musicApi.search(query, searchSource),
    enabled: false,
  });

  useEffect(() => {
    let timer: number | undefined;
    if (isPlaying && customTracks.length > 0 && !isPlayingCustom && intervalSeconds > 0) {
      timer = window.setInterval(() => {
        const now = Date.now();
        if (!lastCustomPlayedAt || now - lastCustomPlayedAt >= intervalSeconds * 1000) {
          playNextCustomTrack();
        }
      }, 1000);
    }

    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, customTracks, isPlayingCustom, intervalSeconds, lastCustomPlayedAt]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({ title: "Enter search text", description: "Type a few words to search on YouTube." });
      return;
    }
    try {
      await refetch();
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error?.message ?? "Unable to perform search.",
        variant: "destructive",
      });
    }
  };

  const addToQueue = (item: MusicSearchResult) => {
    setQueue((prev) => [...prev, { ...item, kind: "main" }]);
    if (activeIndex === -1) {
      setActiveIndex(0);
      setSelectedResult(item);
    }
  };

  const playFromQueue = (index: number) => {
    const item = queue[index];
    if (!item) return;
    setActiveIndex(index);
    setSelectedResult(item);
    setIsPlaying(true);
    setIsPlayingCustom(false);
    setLastCustomPlayedAt(Date.now());
  };

  const playNextMain = () => {
    setIsPlayingCustom(false);
    setLastCustomPlayedAt(Date.now());
    setActiveIndex((prev) => {
      if (queue.length === 0) return -1;
      const next = prev < 0 ? 0 : (prev + 1) % queue.length;
      const item = queue[next];
      setSelectedResult(item);
      return next;
    });
  };

  const togglePlayPause = () => {
    if (isPlayingCustom) {
      const audio = customAudioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) {
      setIsPlaying((prev) => !prev);
      return;
    }
    const action = isPlaying ? "pauseVideo" : "playVideo";
    iframe.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: action,
        args: [],
      }),
      "*"
    );
    setIsPlaying((prev) => !prev);
  };

  const playNextCustomTrack = () => {
    if (customTracks.length === 0) return;
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "pauseVideo",
          args: [],
        }),
        "*"
      );
    }
    const index = Math.floor(Math.random() * customTracks.length);
    const track = customTracks[index];

    const audio = customAudioRef.current;
    if (audio) {
      audio.src = track.thumbnail || track.id || "";
      audio.play().catch(() => undefined);
      setIsPlaying(true);
      setIsPlayingCustom(true);
      setLastCustomPlayedAt(Date.now());
    }
  };

  const handleCustomEnded = () => {
    setIsPlayingCustom(false);
    playNextMain();
  };

  const handleAddCustom = () => {
    if (!customTitle.trim() || !customUrl.trim()) {
      toast({
        title: "Missing details",
        description: "Enter both a title and a direct audio URL for your custom song.",
      });
      return;
    }
    setCustomTracks((prev) => [
      ...prev,
      {
        id: customUrl,
        title: customTitle,
        thumbnail: customUrl,
        source: "other",
        kind: "custom",
      },
    ]);
    setCustomTitle("");
    setCustomUrl("");
  };

  const removeCustomTrack = (id: string) => {
    setCustomTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const youtubeUrlFromId = (id?: string | null) =>
    id ? `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1` : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="text-center text-white space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
            <Music2 className="text-emerald-400" /> Smart Music Player
          </h1>
          <p className="text-slate-300 text-sm md:text-base">
            Search YouTube, build a long playlist, and mix in your own songs at fixed intervals.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[2fr,1.4fr]">
          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Youtube className="text-red-500" /> Search from YouTube
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Type song name, artist, or mood..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
                <Button
                  type="submit"
                  disabled={isFetching}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {isFetching ? "Searching..." : "Search"}
                </Button>
              </form>

              {data?.results && data.results.length > 0 && (
                <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                  {data.results.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-2 rounded-md bg-slate-800/80 hover:bg-slate-700/80 transition cursor-pointer"
                    >
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-100 line-clamp-2">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.channelTitle}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => {
                              setSelectedResult(item);
                              setIsPlaying(true);
                              setIsPlayingCustom(false);
                              setActiveIndex(-1);
                              setLastCustomPlayedAt(Date.now());
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" /> Play now
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="border-slate-500 text-slate-200 hover:bg-slate-500/10"
                            onClick={() => addToQueue(item)}
                          >
                            Add to queue
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Clock className="text-emerald-400" /> Custom songs at intervals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">
                  Interval between custom songs (seconds)
                </label>
                <div className="flex items-center gap-3">
                  <Slider
                    min={60}
                    max={600}
                    step={30}
                    value={[intervalSeconds]}
                    onValueChange={([v]) => setIntervalSeconds(v)}
                  />
                  <span className="w-12 text-right text-sm text-slate-100">
                    {intervalSeconds}s
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Custom song title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
                <Input
                  placeholder="Direct audio URL (e.g. your file hosting or Spotify preview URL)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100 text-xs"
                />
                <Button
                  type="button"
                  onClick={handleAddCustom}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Add custom song
                </Button>
              </div>

              {customTracks.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between text-xs bg-slate-800 rounded px-2 py-1"
                    >
                      <span className="truncate text-slate-100">{track.title}</span>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        onClick={() => removeCustomTrack(track.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Note: For legal reasons, this player cannot remove ads from YouTube or Spotify.
                Use your own ad-free audio URLs if you need completely uninterrupted playback.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-[2fr,1.4fr]">
          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Music2 className="text-emerald-400" /> Now playing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedResult ? (
                <>
                  <div className="flex items-start gap-3">
                    {selectedResult.thumbnail && (
                      <img
                        src={selectedResult.thumbnail}
                        alt={selectedResult.title}
                        className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-100 line-clamp-2">
                        {selectedResult.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {selectedResult.channelTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" /> Play
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-slate-500 text-slate-200 hover:bg-slate-500/10"
                      onClick={playNextMain}
                    >
                      <SkipForward className="w-4 h-4 mr-1" /> Next in queue
                    </Button>
                    <span className="text-[11px] text-slate-400">
                      {isPlayingCustom ? "Playing custom track" : "Playing main queue"}
                    </span>
                  </div>

                  <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                    {selectedResult.source === "youtube" && selectedResult.id && (
                      <iframe
                        ref={iframeRef}
                        className="w-full h-full"
                        src={youtubeUrlFromId(selectedResult.id)}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedResult.title}
                      />
                    )}
                  </div>

                  <audio
                    ref={customAudioRef}
                    className="hidden"
                    onEnded={handleCustomEnded}
                  />
                </>
              ) : (
                <p className="text-slate-400 text-sm">
                  Nothing is playing yet. Search for a song above and click &quot;Play now&quot; or
                  add a few tracks to the queue.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                Playlist / Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[360px] overflow-y-auto">
              {queue.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Queue is empty. Add songs from search results to keep music playing continuously.
                </p>
              ) : (
                queue.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className={`flex items-center justify-between rounded px-2 py-1 text-xs cursor-pointer ${
                      index === activeIndex
                        ? "bg-emerald-600/30 text-emerald-100"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                    onClick={() => playFromQueue(index)}
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="ml-2 text-[10px] text-slate-400 flex-shrink-0">
                      {item.source}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}