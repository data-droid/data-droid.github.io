#!/usr/bin/env python3
import os
import re
import glob

def fix_heading_anchors(file_path):
    """포스트 파일의 헤딩에 앵커 ID 추가"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 목차가 있는 파일만 처리
    if '## 📋 목차' not in content:
        return False
    
    # 헤딩 패턴 찾기 (이모지가 있는 헤딩)
    heading_pattern = r'^## ([🎯🔥⚡📊📚🚀🔄☁️🏗️🔧📈🛠️📋])\s*([^{]+?)(?:\s*\{#[^}]+\})?$'
    
    def add_anchor(match):
        emoji = match.group(1)
        title = match.group(2).strip()
        
        # 이미 앵커가 있으면 그대로 반환
        if '{#' in match.group(0):
            return match.group(0)
        
        # 한국어 제목을 앵커 ID로 변환
        anchor_id = title.lower()
        anchor_id = re.sub(r'[^\w가-힣\s-]', '', anchor_id)  # 특수문자 제거
        anchor_id = re.sub(r'\s+', '-', anchor_id)  # 공백을 하이픈으로
        anchor_id = anchor_id.strip('-')  # 앞뒤 하이픈 제거
        
        return f'## {emoji} {title} {{#{anchor_id}}}'
    
    # 헤딩 수정
    new_content = re.sub(heading_pattern, add_anchor, content, flags=re.MULTILINE)
    
    # 변경사항이 있으면 파일 저장
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    
    return False

def main():
    # _posts 디렉토리의 모든 마크다운 파일 처리
    post_files = glob.glob('_posts/*.md')
    en_post_files = glob.glob('_en_posts/*.md')
    
    all_files = post_files + en_post_files
    
    modified_count = 0
    
    for file_path in all_files:
        if fix_heading_anchors(file_path):
            print(f"✅ 수정됨: {file_path}")
            modified_count += 1
        else:
            print(f"⏭️  건너뜀: {file_path}")
    
    print(f"\n🎉 총 {modified_count}개 파일이 수정되었습니다!")

if __name__ == '__main__':
    main()
