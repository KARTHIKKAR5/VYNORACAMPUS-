export type TimetableEntry = { id:string; day:string; startTime:string; endTime?:string; subject:string; courseCode?:string; faculty?:string; room?:string; type?:string; source:'sru'; fetchedAt:string }
export type TimetableSnapshot = { status:'fresh'|'stale'|'unconfigured'|'error'; entries:TimetableEntry[]; today?:TimetableEntry[]; fetchedAt?:string; error?:string }
export type TimetableCurrentSnapshot = TimetableSnapshot & { status:'fresh'|'stale'|'unconfigured'|'error'; today:TimetableEntry[]; class?:TimetableEntry|null; timetableStatus?:'ongoing'|'upcoming'|'finished'|'no_classes' }
