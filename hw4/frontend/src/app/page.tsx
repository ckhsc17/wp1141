'use client';

import React, { useState } from 'react';
import {
  AppShell,
  Container,
  Group,
  Title,
  Button,
  ActionIcon,
  Drawer,
  Stack,
  Text
} from '@mantine/core';
import {
  IconPlus,
  IconFilter,
  IconLocation,
  IconMap
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

export default function HomePage() {
  const [treasureFormOpened, { open: openTreasureForm, close: closeTreasureForm }] = useDisclosure(false);
  const [sidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group>
              <IconMap size={32} color="#FD7E14" />
              <Title order={2} c="orange">
                尋寶地圖
              </Title>
            </Group>
            
            <Group>
              <Button
                leftSection={<IconLocation size={16} />}
                variant="outline"
                size="sm"
              >
                我的位置
              </Button>
              
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openTreasureForm}
                size="sm"
              >
                新增寶藏
              </Button>
              
              <ActionIcon
                variant="outline"
                size="lg"
                onClick={openSidebar}
              >
                <IconFilter size={18} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" h="calc(100vh - 70px)">
          <div style={{ 
            height: '100%', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text size="lg" c="dimmed">
              地圖載入中...
            </Text>
          </div>
        </Container>
      </AppShell.Main>

      <Drawer
        opened={sidebarOpened}
        onClose={closeSidebar}
        title="寶藏總覽"
        size="lg"
        position="right"
      >
        <Stack gap="md">
          <Text>寶藏功能開發中...</Text>
        </Stack>
      </Drawer>
    </AppShell>
  );
}
