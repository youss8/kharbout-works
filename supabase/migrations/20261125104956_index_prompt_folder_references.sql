create index prompt_folders_by_owner on public.prompt_folders (owner_id);
create index prompt_folder_invites_by_folder on public.prompt_folder_invites (folder_id);
