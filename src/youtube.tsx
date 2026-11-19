import { youtubeId } from "./youtube-id";

export { youtubeId };

export function HowTo({ url, title, site }: { url: string; title: string; site?: string }) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const id = youtubeId(trimmed);
  return (
    <div className="howto">
      {id ? (
        <iframe
          className="video"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`}
          title={`How-to video: ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}
      <a className="btn primary" href={trimmed} target="_blank" rel="noreferrer">
        Watch how-to
      </a>
      {site ? <p className="note">{site}</p> : null}
    </div>
  );
}
