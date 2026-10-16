addEventListener('message', event => {
  if (event.source !== parent) return;
  const {id, code} = event.data || {};
  if (typeof id !== 'string' || typeof code !== 'string' || code.length > 10000) return;
  const logs = [];
  let iterations = 0;
  const env = {
    __tick: () => { if (++iterations > 10000) throw new Error('Слишком много повторов. Проверь условие цикла.'); },
    print: (...values) => {
      if (logs.join('\n').length < 1800) logs.push(values.map(value => value === true ? 'True' : value === false ? 'False' : value == null ? 'None' : String(value)).join(' ').slice(0, 500));
    },
    range: (...args) => {
      if (args.length < 1 || args.length > 3 || !args.every(Number.isSafeInteger)) throw new Error('range() принимает от одного до трёх целых чисел.');
      const [start, stop, step] = args.length === 1 ? [0, args[0], 1] : [args[0], args[1], args[2] ?? 1];
      if (step === 0) throw new Error('Шаг range() не может быть нулём.');
      const length = Math.max(0, Math.ceil((stop - start) / step));
      if (length > 1000) throw new Error('Для учебного задания используй не больше 1000 повторов.');
      return Array.from({ length }, (_, i) => start + i * step);
    },
    int: value => parseInt(value, 10), str: value => String(value), len: value => value ? value.length : 0
  };
  try {
    const fn = new Function('env', `with(new Proxy(env,{has:()=>true,get:(o,k)=>k===Symbol.unscopables?undefined:o[k],set:(o,k,v)=>(o[k]=v,true)})){${code}\n}`);
    fn(env);
    parent.postMessage({id, result:{success:true, output:logs.join('\n')}}, '*');
  } catch(error) {
    parent.postMessage({id, result:{success:false, error:String(error?.message || 'Ошибка выполнения').slice(0, 200), output:logs.join('\n')}}, '*');
  }
}, {once:true});
