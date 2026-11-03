// Menus keep native Tab/Enter behavior; game shortcuts never steal their keystrokes.
(()=>{const css=document.createElement('style');css.textContent=':focus-visible{outline:3px solid #ffe47a!important;outline-offset:3px}.keyboard-note{font:12px system-ui;color:inherit;opacity:.85}';document.head.append(css);
 document.addEventListener('keydown',e=>{const el=e.target;if(!(el instanceof Element))return;const control=el.closest('button,a,input,select,textarea,[contenteditable=true]');if(!control)return;
 const board=control.closest('#board'),squares=board?[...board.querySelectorAll('button')]:[],index=squares.indexOf(control),cols=squares.length===9?3:8;
 if(board&&index>=0&&e.key.startsWith('Arrow')){e.preventDefault();e.stopImmediatePropagation();const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-cols,ArrowDown:cols}[e.key];let next=index+delta;while(next>=0&&next<squares.length&&squares[next].disabled)next+=delta;if(next>=0&&next<squares.length)squares[next].focus();return}
 if(e.key!=='Escape')e.stopImmediatePropagation();
 },true);
})();