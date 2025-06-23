export function TagFilter({tags,selected,onSel}:{tags:string[],selected:string,onSel:(t:string)=>void}){
  return (
    <div className="tags">
      {tags.map(t=>(
        <button key={t} onClick={()=>onSel(t)}
          style={{fontWeight:t===selected?'bold':'normal'}}>{t}</button>
      ))}
    </div>
  );
}
