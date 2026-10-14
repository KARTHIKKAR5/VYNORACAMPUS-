export type Student={id:string;name:string;initials:string;dept:string;year:string;skills:string[];interest:string;online?:boolean;color:string}
export const students:Student[]=[
 {id:'a',name:'Aarav Mehta',initials:'AM',dept:'Computer Science',year:'III year',skills:['React','TypeScript','Systems'],interest:'Building useful campus tools',online:true,color:'#c3e1d2'},
 {id:'n',name:'Nisha Raman',initials:'NR',dept:'Design',year:'II year',skills:['Figma','Research','Brand'],interest:'Designing for everyday friction',online:true,color:'#e6c7a8'},
 {id:'k',name:'Kabir Shah',initials:'KS',dept:'Computer Science',year:'III year',skills:['Python','ML','Data'],interest:'Applied machine learning',color:'#c9d8f1'},
 {id:'s',name:'Sana Iqbal',initials:'SI',dept:'Electronics',year:'II year',skills:['IoT','Arduino','UX'],interest:'Tinkering with physical systems',online:true,color:'#dfc6e6'},
 {id:'r',name:'Rohan Nair',initials:'RN',dept:'Business',year:'IV year',skills:['Pitching','Product','Research'],interest:'Early-stage teams',color:'#f0d9a8'}]
export const projects=[
 {id:'orbit',name:'Orbit — Campus mobility',about:'A smarter way to share rides, find shuttle timings and report last-mile gaps.',skills:['React','Figma','Maps'],members:3,max:5,status:'Building',recruiting:true,owner:'Nisha Raman',accent:'#e85d3f'},
 {id:'quiet',name:'Quiet Hours',about:'Live availability for focused study spaces across campus.',skills:['Python','IoT','UI/UX'],members:2,max:4,status:'Planning',recruiting:true,owner:'Sana Iqbal',accent:'#176b5a'},
 {id:'papertrail',name:'Papertrail',about:'A focused archive for past papers, notes and course context.',skills:['React','Content'],members:4,max:4,status:'Testing',recruiting:false,owner:'Aarav Mehta',accent:'#3565b5'}]
export const notifications=[
 {id:'1',title:'Nisha Raman requested to join Quiet Hours',detail:'Figma · Research · UX',time:'8m',kind:'project'},
 {id:'2',title:'Kabir replied to your community post',detail:'“I have a clean starter notebook for that.”',time:'26m',kind:'community'},
 {id:'3',title:'New: Google STEP internship deadline',detail:'Opportunity · 4 days remaining',time:'1h',kind:'opportunity'}]
