export function TodoItem({ t, onDel }:{
  t:{id:string,text:string,tag:string}; onDel:(id:string)=>void}) {
  return (
    <li className="todo">
      {t.text}
      <span className={'chip chip-'+t.tag.toLowerCase()}>{t.tag}</span>
      <button onClick={()=>onDel(t.id)}>✕</button>
    </li>
  );
}
