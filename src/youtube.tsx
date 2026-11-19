import { thumbnailUrl, watchUrl } from "./youtube-id";

export function HowTo({ url, title, site }: { url: string; title: string; site?: string }) {
  const watch = watchUrl(url);
  if (!watch) return null;
  const poster = thumbnailUrl(url);
  const label = `Watch how-to: ${title}`;
  return (
    <div className="howto">
      {poster ? (
        <a className="thumb" href={watch} target="_blank" rel="noopener" aria-label={label}>
          <img src={poster} alt="" />
          <span className="play" aria-hidden="true" />
        </a>
      ) : null}
      <a className="btn primary" href={watch} target="_blank" rel="noopener">
        Watch how-to
      </a>
      {site ? <p className="note">{site}</p> : null}
    </div>
  );
}
